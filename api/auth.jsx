import express from "express"
import bs58 from "bs58"
import { OAuth2Client } from "google-auth-library"
import nacl from "tweetnacl"
import postgres from "postgres"
import { createHmac, timingSafeEqual } from "node:crypto"
import { reject } from "./misc.jsx"

const google = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null
const sql = postgres(process.env.DATABASE_URL)

function issue(res, account) {
  const sig = createHmac("sha256", process.env.SESSION_SECRET)
    .update(account)
    .digest("hex")
  const token = encodeURIComponent(`${account}.${sig}`)
  res.setHeader(
    "Set-Cookie",
    `session=${token}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 30}`,
  )
}

function account(req) {
  const cookie = req.headers.cookie
  if (!cookie) return null
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/)
  if (!match) return null

  const [account, sig] = decodeURIComponent(match[1]).split(".")
  if (!account || !sig) return null

  const expected = createHmac("sha256", process.env.SESSION_SECRET)
    .update(account)
    .digest("hex")
  const a = Buffer.from(sig, "hex")
  const b = Buffer.from(expected, "hex")
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return account
}

export function verify(body) {
  const { pubkey, signature, message } = body || {}
  if (!pubkey || !signature || !message) {
    reject(400, "missing pubkey/signature/message")
  }
  if (!message.startsWith("Sign in to Valgrid at ")) {
    reject(400, "invalid message format")
  }
  const ts = Date.parse(message.slice("Sign in to Valgrid at ".length))
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
    reject(400, "message expired")
  }
  const ok = nacl.sign.detached.verify(
    new TextEncoder().encode(message),
    Buffer.from(signature, "base64"),
    bs58.decode(pubkey),
  )
  if (!ok) {
    reject(401, "bad signature")
  }
  return pubkey
}

export function authorize(req, res, next) {
  const id = account(req)
  if (!id) return res.status(401).json({ error: "not signed in" })
  req.account = id
  next()
}

export function googleClientId() {
  return process.env.GOOGLE_CLIENT_ID || null
}

export async function verifyGoogle(idToken) {
  if (!google) {
    reject(503, "Google sign-in not configured")
  }
  if (!idToken) {
    reject(400, "missing id_token")
  }
  const ticket = await google.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  const { sub } = ticket.getPayload()
  return { sub }
}

function clear(res) {
  res.setHeader(
    "Set-Cookie",
    "session=; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=0",
  )
}

async function walletSession(body) {
  const pubkey = verify(body)
  const [row] = await sql`
      WITH found AS (
        SELECT
          wallets.id,
          wallets.account_id,
          accounts.primary_wallet_id = wallets.id AS login_wallet
        FROM wallets
        JOIN accounts ON accounts.id = wallets.account_id
        WHERE chain = 'solana'
          AND address = ${pubkey}
      ),
      login_wallet AS (
        SELECT account_id
        FROM found
        WHERE login_wallet = true
      ),
      account AS (
        INSERT INTO accounts (google_sub, tier)
        SELECT NULL, 'free'
        WHERE NOT EXISTS (SELECT 1 FROM found)
        RETURNING id
      ),
      wallet AS (
        INSERT INTO wallets (account_id, address, chain)
        SELECT id, ${pubkey}, 'solana'
        FROM account
        RETURNING id, account_id
      ),
      primary_wallet AS (
        UPDATE accounts
           SET primary_wallet_id = wallet.id
          FROM wallet
         WHERE accounts.id = wallet.account_id
         RETURNING accounts.id
      )
      SELECT account_id AS id FROM login_wallet
      UNION ALL
      SELECT id FROM primary_wallet
      LIMIT 1
    `
  if (!row) {
    reject(401, "wallet is not a login wallet")
  }
  return row.id
}

async function googleSession(body) {
  const { sub } = await verifyGoogle(body?.id_token)
  const [row] = await sql`
      WITH found AS (
        SELECT id
        FROM accounts
        WHERE google_sub = ${sub}
      ),
      account AS (
        INSERT INTO accounts (google_sub, tier)
        SELECT ${sub}, 'free'
        WHERE NOT EXISTS (SELECT 1 FROM found)
        RETURNING id
      )
      SELECT id FROM found
      UNION ALL
      SELECT id FROM account
      LIMIT 1
    `
  if (!row) {
    reject(409, "Google account already attached elsewhere")
  }
  return row.id
}

export const authRoutes = express.Router()

const sessions = {
  wallet: walletSession,
  google: googleSession,
}

authRoutes.patch("/auth/session", async (req, res, next) => {
  try {
    const state = req.body?.state
    if (state === null) {
      clear(res)
      return res.json({ ok: true })
    }
    const start = sessions[state]
    if (!start) return res.status(400).json({ error: "invalid session state" })
    const account = await start(req.body)
    issue(res, account)
    res.json({ id: account })
  } catch (e) {
    next(e)
  }
})

authRoutes.get("/auth/me", async (req, res, next) => {
  try {
    const id = account(req)
    const google = { client: googleClientId() }
    if (!id) {
      return res.json({ id: null, google, account: null })
    }
    const [row] = await sql`
      SELECT id, google_sub, tier, primary_wallet_id, created_at
      FROM accounts
      WHERE id = ${id}
    `
    res.json({
      id,
      google,
      account: row ?? null,
    })
  } catch (e) {
    next(e)
  }
})

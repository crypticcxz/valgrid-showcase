import express from "express"
import postgres from "postgres"
import { authorize, verifyGoogle } from "./auth.jsx"
import { has, objectBody } from "./misc.jsx"

const sql = postgres(process.env.DATABASE_URL)

export const accountRoutes = express.Router()

accountRoutes.patch("/account/:id", authorize, async (req, res, next) => {
  try {
    if (req.params.id !== req.account) {
      return res.status(403).json({ error: "wrong account" })
    }
    const body = objectBody(req)
    const patch = {}
    if (has(body, "id_token")) {
      const { sub } = await verifyGoogle(body.id_token)
      patch.google_sub = sub
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "no account changes" })
    }

    const [row] = await sql`
      WITH patch AS (
        SELECT ${sql.json(patch)}::jsonb AS body
      )
      UPDATE accounts
         SET google_sub = CASE WHEN patch.body ? 'google_sub' THEN patch.body->>'google_sub' ELSE accounts.google_sub END
        FROM patch
       WHERE id = ${req.account}
         AND (
           NOT (patch.body ? 'google_sub')
           OR NOT EXISTS (
             SELECT 1 FROM accounts taken
              WHERE taken.google_sub = patch.body->>'google_sub'
                AND taken.id <> ${req.account}
           )
         )
       RETURNING id, primary_wallet_id, google_sub, tier, created_at
    `
    if (!row) {
      return res
        .status(409)
        .json({ error: "Google account already attached elsewhere" })
    }
    res.json(row)
  } catch (e) {
    next(e)
  }
})

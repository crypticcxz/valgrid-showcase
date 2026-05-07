import { useEffect, useState } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { api } from "./api"
import { byTimeAsc, nowIso } from "./misc"

export async function sign() {
  const provider = window.solana
  if (!provider) {
    throw new Error(
      "No Solana wallet detected. Install Phantom, Solflare, or Backpack.",
    )
  }
  const { publicKey } = await provider.connect()
  const message = `Sign in to Valgrid at ${nowIso()}`
  const encoded = new TextEncoder().encode(message)
  const { signature } = await provider.signMessage(encoded, "utf8")
  return {
    pubkey: publicKey.toBase58(),
    signature: btoa(String.fromCharCode(...signature)),
    message,
  }
}

export async function login() {
  const payload = await sign()
  if (!payload) return null
  return api("PATCH", "/api/auth/session", {
    state: "wallet",
    ...payload,
  })
}

export function googleLogin(idToken) {
  return api("PATCH", "/api/auth/session", {
    state: "google",
    id_token: idToken,
  })
}

export function logout() {
  return api("PATCH", "/api/auth/session", { state: null })
}

export function useAccount() {
  const [accountId, setAccountId] = useState(null)
  const [google, setGoogle] = useState(null)
  const [loading, setLoading] = useState(true)
  /** Snapshot from GET /api/auth/me when Electric has not synced the row yet */
  const [sessionAccount, setSessionAccount] = useState(null)

  useEffect(() => {
    api("GET", "/api/auth/me")
      .then((data) => {
        if (data?.google) setGoogle(data.google)
        if (data?.id) {
          setAccountId(data.id)
          setSessionAccount(data.account ?? null)
        } else {
          setAccountId(null)
          setSessionAccount(null)
        }
      })
      .catch((e) => {
        console.info("No active session:", e.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const signin = (id) => {
    setAccountId(id)
    api("GET", "/api/auth/me")
      .then((data) => {
        if (data?.account) setSessionAccount(data.account)
      })
      .catch(() => {})
  }

  const signout = () => {
    setAccountId(null)
    setSessionAccount(null)
    logout().catch((err) => console.error("Sign out failed:", err))
  }

  return {
    account: accountId,
    google,
    sessionAccount,
    signin,
    signout,
    loading,
  }
}

export function useMe(accountCollection, walletCollection, accountId, sessionAccount) {
  const { data: accounts = [] } = useLiveQuery(accountCollection)
  const { data: rows = [] } = useLiveQuery(walletCollection)

  const row =
    accounts[0] ??
    sessionAccount ??
    (accountId
      ? {
          id: accountId,
          google_sub: null,
          tier: "free",
          primary_wallet_id: null,
          created_at: null,
        }
      : null)
  const sortedWallets = [...rows].sort((a, b) => {
    if (a.id === row?.primary_wallet_id) return -1
    if (b.id === row?.primary_wallet_id) return 1
    return byTimeAsc("created_at")(a, b)
  })

  return {
    id: accountId,
    ...row,
    wallets: sortedWallets,
    // Frontend-only mode: if we have a session/account id, render immediately.
    // Live collections can hydrate in the background when available.
    ready: Boolean(accountId),
  }
}

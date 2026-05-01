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

  useEffect(() => {
    api("GET", "/api/auth/me")
      .then((data) => {
        if (data && data.google) setGoogle(data.google)
        if (data && data.id) setAccountId(data.id)
      })
      .catch((e) => {
        console.info("No active session:", e.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const signin = (id) => setAccountId(id)

  const signout = () => {
    setAccountId(null)
    logout().catch((err) => console.error("Sign out failed:", err))
  }

  return { account: accountId, google, signin, signout, loading }
}

export function useMe(accountCollection, walletCollection, accountId) {
  const { data: accounts = [] } = useLiveQuery(accountCollection)
  const { data: rows = [] } = useLiveQuery(walletCollection)

  const row = accounts[0]
  const sortedWallets = [...rows].sort((a, b) => {
    if (a.id === row?.primary_wallet_id) return -1
    if (b.id === row?.primary_wallet_id) return 1
    return byTimeAsc("created_at")(a, b)
  })

  return {
    id: accountId,
    ...row,
    wallets: sortedWallets,
    ready: Boolean(accountId && row),
  }
}

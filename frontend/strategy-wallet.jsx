import { useCallback, useEffect, useMemo, useState } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import {
  strategyWalletBalances,
  strategyWalletFundingRequests,
  strategyWallets,
} from "./data"
import { requestBalanceRefresh } from "./collections"
import {
  BLOCKCHAIN_NETWORKS,
  byTimeAsc,
  isRefreshing,
  lamportsToSol,
  short,
  sol,
} from "./misc"
import { useToast } from "./toast"

export function StrategyWalletBalanceBadge({ strategy }) {
  const balanceStore = strategyWalletBalances(strategy.id)
  const { data: balanceRows = [] } = useLiveQuery(balanceStore)
  const row = balanceRows.find(
    (balance) => balance.network === strategy.blockchain_network,
  )
  return (
    <div className="hidden rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/55 sm:block">
      {sol(lamportsToSol(row?.lamports))}
    </div>
  )
}

export function StrategyWalletView({ strategy }) {
  const walletStore = strategyWallets(strategy.id)
  const balanceStore = strategyWalletBalances(strategy.id)
  const fundingStore = strategyWalletFundingRequests(strategy.id)
  const { data: walletRows = [] } = useLiveQuery(walletStore)
  const { data: balanceRows = [] } = useLiveQuery(balanceStore)
  const { data: fundingRows = [] } = useLiveQuery(fundingStore)
  const [fundAmount, setFundAmount] = useState("0.25")
  const toast = useToast()
  const wallet = walletRows.find((row) => row.id === strategy.strategy_wallet_id)
  const balances = useMemo(() => {
    const grouped = {}
    for (const row of balanceRows) {
      grouped[row.network] = {
        error: row.error,
        lamports: row.lamports,
        sol: lamportsToSol(row.lamports),
      }
    }
    return grouped
  }, [balanceRows])
  const loading = wallet && isRefreshing(wallet)
  const activeBalance = balances[strategy.blockchain_network]
  const walletFundingRows = fundingRows
    .filter((request) => request.strategy_wallet_id === strategy.strategy_wallet_id)
    .sort(byTimeAsc("created_at"))
  const latestFunding = walletFundingRows.at(-1)
  const funding =
    latestFunding?.status === "pending" || latestFunding?.status === "processing"
  const fundingError =
    latestFunding?.status === "failed" ? latestFunding.error : null
  const fundingComplete = latestFunding?.status === "complete"

  const refresh = useCallback(() => {
    if (!wallet) return
    requestBalanceRefresh(walletStore, wallet.id)
  }, [wallet, walletStore])

  useEffect(() => {
    if (fundingComplete && wallet && !isRefreshing(wallet)) {
      refresh()
    }
  }, [fundingComplete, refresh, wallet])

  useEffect(() => {
    if (wallet && balanceRows.length === 0 && !isRefreshing(wallet)) {
      refresh()
    }
  }, [balanceRows.length, refresh, wallet])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(strategy.strategy_wallet_address)
      toast("Strategy wallet copied", { variant: "success" })
    } catch (e) {
      toast(e?.message, { variant: "error" })
    }
  }

  const amountSol = Number(fundAmount)
  const validAmount = Number.isFinite(amountSol) && amountSol > 0
  const fundParams = new URLSearchParams({
    cluster: strategy.blockchain_network,
  })
  if (validAmount) fundParams.set("amount", String(amountSol))
  const fundHref = `solana:${encodeURIComponent(
    strategy.strategy_wallet_address,
  )}?${fundParams.toString()}`
  const fund = async () => {
    if (!wallet || !validAmount) return
    if (strategy.blockchain_network !== "devnet") {
      window.location.href = fundHref
      return
    }
    try {
      fundingStore.insert({
        id: crypto.randomUUID(),
        strategy_wallet_id: wallet.id,
        strategy_id: strategy.id,
        account_id: strategy.account_id,
        network: strategy.blockchain_network,
        amount_sol: amountSol,
      })
      toast("Funding requested", { variant: "success" })
    } catch (e) {
      toast(e?.message, { variant: "error" })
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="rounded-lg border border-white/[0.08] bg-[#03111f] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-white/35">
                Strategy wallet
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {loading ? "Refreshing..." : sol(activeBalance?.sol)}
              </h2>
              <p className="mt-1 text-xs text-white/40">
                Balance on {strategy.blockchain_network}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <label className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 text-xs text-white/45">
                SOL
                <input
                  value={fundAmount}
                  onChange={(event) => setFundAmount(event.target.value)}
                  inputMode="decimal"
                  className="w-16 bg-transparent font-mono text-white outline-none"
                  aria-label="Funding amount in SOL"
                />
              </label>
              <button
                type="button"
                onClick={fund}
                disabled={!wallet || !validAmount || funding}
                className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-40"
              >
                {funding ? "Funding..." : "Fund"}
              </button>
              <button
                type="button"
                onClick={refresh}
                disabled={!wallet || loading}
                className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
              >
                Refresh
              </button>
              <a
                href={explorer(
                  strategy.strategy_wallet_address,
                  strategy.blockchain_network,
                )}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.05] hover:text-white"
              >
                Explorer
              </a>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-medium uppercase tracking-widest text-white/35">
                  Address
                </p>
                <p className="mt-1 break-all font-mono text-sm text-white">
                  {strategy.strategy_wallet_address}
                </p>
              </div>
              <button
                type="button"
                onClick={copy}
                className="shrink-0 rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.05] hover:text-white"
              >
                Copy
              </button>
            </div>
            {latestFunding && (
              <p
                className={
                  "mt-2 text-xs " +
                  (fundingError
                    ? "text-red-300"
                    : fundingComplete
                      ? "text-emerald-300"
                      : "text-sky-300")
                }
              >
                {fundingError
                  ? `Funding failed: ${fundingError}`
                  : fundingComplete
                    ? "Funding complete"
                    : "Funding requested"}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {BLOCKCHAIN_NETWORKS.map((network) => {
            const balance = balances[network.value]
            return (
              <div
                key={network.value}
                className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4"
              >
                <p className="text-xs font-medium uppercase tracking-widest text-white/35">
                  {network.label}
                </p>
                <p className="mt-2 font-mono text-lg text-white">
                  {loading
                    ? "..."
                    : balance?.error
                      ? "Error"
                      : sol(balance?.sol)}
                </p>
                {balance?.error && (
                  <p className="mt-1 text-xs text-red-300">{balance.error}</p>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-xs text-white/35">
          {strategy.blockchain_network === "devnet"
            ? "Fund requests devnet SOL for this strategy wallet."
            : `Fund opens your Solana wallet for ${short(strategy.strategy_wallet_address)}.`}
        </p>
      </div>
    </div>
  )
}

function explorer(value, network, type = "address") {
  if (!value) return null
  const cluster = network === "mainnet" ? "" : "?cluster=devnet"
  return `https://solscan.io/${type}/${encodeURIComponent(value)}${cluster}`
}

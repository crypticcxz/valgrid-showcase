import { useCallback, useEffect, useMemo, useState } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import {
  archived,
  requestBalanceRefresh,
} from "./collections"
import { walletBalances } from "./data"
import { Icon, ICONS } from "./icons"
import { PageHeader } from "./layout"
import {
  BLOCKCHAIN_NETWORKS,
  isRefreshing,
  lamportsToSol,
  nowIso,
  short,
  sol,
} from "./misc"
import { useToast } from "./toast"

export function Wallets({ me, collection: store }) {
  const wallets = useMemo(() => me.wallets ?? [], [me.wallets])
  const [pendingArchive, setPendingArchive] = useState(null)
  const walletIdList = useMemo(
    () => wallets.map((wallet) => wallet.id).filter(Boolean),
    [wallets],
  )
  const toast = useToast()
  const balanceStore = walletBalances(me.id)
  const { data: balanceRows = [] } = useLiveQuery(balanceStore)
  const balances = useMemo(() => {
    const grouped = {}
    for (const row of balanceRows) {
      grouped[row.wallet_id] ??= {}
      grouped[row.wallet_id][row.network] = {
        error: row.error,
        lamports: row.lamports,
        sol: lamportsToSol(row.lamports),
      }
    }
    return grouped
  }, [balanceRows])
  const loadingBalances = wallets.some((wallet) => isRefreshing(wallet))

  const load = useCallback(async (ids) => {
    try {
      const requestedAt = nowIso()
      for (const id of ids) {
        requestBalanceRefresh(store, id, requestedAt)
      }
      if (ids.length === 0) {
        toast("No wallets to refresh", { variant: "error" })
      }
    } catch (e) {
      toast(e?.message, { variant: "error" })
    }
  }, [store, toast])

  useEffect(() => {
    if (walletIdList.length > 0) {
      load(walletIdList)
    }
  }, [load, walletIdList])

  const archive = async () => {
    if (!pendingArchive) return
    try {
      archived(store, pendingArchive.id, true)
      setPendingArchive(null)
      toast("Wallet archived")
    } catch (e) {
      toast(e?.message, { variant: "error" })
    }
  }

  if (!me.wallets) return null

  return (
    <div className="space-y-6">
      <PageHeader
        label="Dashboard"
        title="Wallets"
        description="Wallets connected to your account."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load(walletIdList)}
            disabled={loadingBalances || wallets.length === 0}
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.03] hover:text-white disabled:opacity-50 transition-colors"
          >
            {loadingBalances ? "Refreshing..." : "Refresh balances"}
          </button>
        </div>
      </PageHeader>

      {wallets.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((w) => {
            const primary = w.id === me.primary_wallet_id
            return (
              <div
                key={w.id}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#03111f] p-5 transition-all duration-300 hover:border-sky-500/30 hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgb(56_189_248_/_0.08)]"
              >
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Icon d={ICONS.wallets} size={20} />
                </div>
                <button
                  type="button"
                  onClick={() => setPendingArchive(w)}
                  disabled={primary}
                  className="rounded-lg p-2 text-white/40 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Archive"
                  title={primary ? "Login wallet cannot be archived" : "Archive"}
                >
                  <Icon d={ICONS.archive} />
                </button>
              </div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/50 mb-1">
                {w.chain}
              </p>
              <p className="font-mono text-sm text-white truncate">
                {w.address}
              </p>
              <Balance
                balances={balances[w.id]}
                loading={loadingBalances}
              />
              </div>
            )
          })}
        </div>
      )}
      <ArchiveWallet
        wallet={pendingArchive}
        onCancel={() => setPendingArchive(null)}
        onConfirm={archive}
      />
    </div>
  )
}

function ArchiveWallet({ wallet, onCancel, onConfirm }) {
  if (!wallet) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020b14]/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#03111f] p-4 shadow-2xl shadow-sky-950/30">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-white">Archive wallet</h2>
          <p className="mt-1 text-xs leading-5 text-white/45">
            Archive {short(wallet.address)}?
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/55 hover:bg-white/[0.06] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  )
}

function Balance({ balances, loading }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {BLOCKCHAIN_NETWORKS.map((network) => {
        const balance = balances?.[network.value]
        return (
          <div
            key={network.value}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
              {network.label}
            </p>
            <p className="mt-1 font-mono text-sm text-white">
              {loading
                ? "..."
                : balance?.error
                  ? "Error"
                  : sol(balance?.sol)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-white/[0.08] bg-[#03111f]">
      <div className="w-20 h-20 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 text-sky-400">
        <Icon d={ICONS.wallets} size={36} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No wallets yet</h3>
      <p className="text-sm text-white/50 text-center max-w-md mb-6">
        Sign in with a wallet to track balances here.
      </p>
    </div>
  )
}

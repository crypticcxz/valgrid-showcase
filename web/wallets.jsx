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
    <div className="mx-auto max-w-5xl space-y-8">
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
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#0094BC] px-6 text-sm font-semibold text-white shadow-[0_0_30px_rgb(0_148_188_/_0.25)] transition-all duration-300 hover:bg-[#00aad8] hover:shadow-[0_0_40px_rgb(123_208_249_/_0.35)] disabled:cursor-not-allowed disabled:opacity-50"
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
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/90 p-5 shadow-[0_20px_60px_rgb(0_0_0_/_0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7BD0F9]/35 hover:shadow-[0_0_38px_rgb(123_208_249_/_0.14)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl border border-white/[0.10] bg-white/[0.03] flex items-center justify-center text-[#7BD0F9]">
                    <Icon d={ICONS.wallets} size={20} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingArchive(w)}
                    disabled={primary}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-[#06050c] text-white/45 transition-colors hover:border-[#7BD0F9]/35 hover:bg-[#0f0d17] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Archive"
                    title={primary ? "Login wallet cannot be archived" : "Archive"}
                  >
                    <Icon d={ICONS.archive} />
                  </button>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 mb-1">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0a0a0e] p-5 shadow-[0_24px_80px_rgb(0_0_0_/_0.55)]">
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
            className="inline-flex h-9 items-center justify-center rounded-full border border-white/[0.12] bg-[#06050c] px-4 text-xs font-semibold text-white/75 transition-colors hover:border-[#7BD0F9]/35 hover:bg-[#0f0d17] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#0094BC] px-4 text-xs font-semibold text-white shadow-[0_0_24px_rgb(0_148_188_/_0.22)] transition-all duration-300 hover:bg-[#00aad8] hover:shadow-[0_0_32px_rgb(123_208_249_/_0.32)]"
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
            className="rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/90 px-4 py-14 shadow-[0_20px_60px_rgb(0_0_0_/_0.35)]">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.03] text-[#7BD0F9]">
        <Icon d={ICONS.wallets} size={36} />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">No wallets yet</h3>
      <p className="mb-6 max-w-md text-center text-sm text-white/50">
        Sign in with a wallet to track balances here.
      </p>
    </div>
  )
}

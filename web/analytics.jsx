import { useMemo } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { openaiUsage, strategyRuns } from "./data"
import { Icon, ICONS } from "./icons"
import { PageHeader } from "./layout"
import { integer, isActiveStrategy, money, monthYear, shortDate } from "./misc"

const RANGE_OPTIONS = ["7 Days", "30 Days", "90 Days", "All Time"]

export function Analytics({ account: accountId, store }) {
  const runsCollection = strategyRuns(accountId)
  const usageCollection = openaiUsage(accountId)
  const { data: strategies = [] } = useLiveQuery(store)
  const { data: runs = [] } = useLiveQuery(runsCollection)
  const { data: usage = [] } = useLiveQuery(usageCollection)
  const active = strategies.filter(isActiveStrategy)
  const createdAt = active
    .map((strategy) => strategy.created_at)
    .filter(Boolean)
    .sort()
    .pop()
  const recentRuns = useMemo(
    () =>
      [...runs]
        .filter((row) => row.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8),
    [runs],
  )
  const billing = useMemo(() => monthlyBilling(runs, usage), [runs, usage])
  const hasTradingData = runs.length > 0 || active.length > 0

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        label="Dashboard"
        title="Analytics"
        description="Track your trading performance and P&L across all grid strategies."
      />

      <div className="flex flex-wrap items-center gap-2">
        {RANGE_OPTIONS.map((range, index) => (
          <button
            key={range}
            type="button"
            className={
              "inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition-colors " +
              (index === 1
                ? "border-[#7BD0F9]/40 bg-[#0094BC]/20 text-[#B4F1FF]"
                : "border-white/[0.08] bg-[#06050c] text-white/70 hover:border-[#7BD0F9]/30 hover:text-white")
            }
          >
            {range}
          </button>
        ))}
      </div>

      <PerformancePanel
        billing={billing}
        activeCount={active.length}
        newestAt={createdAt}
        hasTradingData={hasTradingData}
      />

      <RecentTradesPanel runs={recentRuns} />
    </div>
  )
}

function monthlyBilling(runs, usage) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const inMonth = (row) => {
    if (!row.created_at) return false
    const value = new Date(row.created_at)
    return value >= start && value < end
  }
  const monthRuns = runs.filter(inMonth)
  const monthUsage = usage.filter(inMonth)
  const sum = (rows, key) =>
    rows.reduce((total, row) => {
      const value = Number(row[key])
      return Number.isFinite(value) ? total + value : total
    }, 0)
  const cpuCostCents = sum(monthRuns, "cost_cents")

  return {
    month: {
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    },
    cpu: {
      seconds: sum(monthRuns, "cpu_seconds"),
      wall_seconds: sum(monthRuns, "wall_seconds"),
      runs: monthRuns.length,
      cost_cents: cpuCostCents,
    },
    openai: {
      input_tokens: sum(monthUsage, "input_tokens"),
      cached_input_tokens: sum(monthUsage, "cached_input_tokens"),
      output_tokens: sum(monthUsage, "output_tokens"),
      total_tokens: sum(monthUsage, "total_tokens"),
      requests: monthUsage.length,
      cost_cents: 0,
    },
    total_cost_cents: cpuCostCents,
  }
}

function PerformancePanel({ billing, activeCount, newestAt, hasTradingData }) {
  const cpu = billing.cpu
  const openai = billing.openai
  const month = billing?.month?.start_at
    ? monthYear(billing.month.start_at)
    : "This month"

  return (
    <section className="min-h-[280px] rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/90 p-5 shadow-[0_20px_60px_rgb(0_0_0_/_0.35)] sm:p-6">
      {hasTradingData ? (
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Performance
            </p>
            <p className="text-sm text-white/55">{month} snapshot</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Stat label="Active strategies" value={integer(activeCount)} />
            <Stat
              label="Total billed"
              value={money(billing.total_cost_cents)}
              subtext="CPU + OpenAI usage"
            />
            <Stat
              label="CPU usage"
              value={money(cpu.cost_cents)}
              subtext={`${integer(cpu.seconds)} sec across ${integer(cpu.runs)} runs`}
            />
            <Stat
              label="OpenAI"
              value={money(openai.cost_cents)}
              subtext={`${integer(openai.total_tokens)} tokens`}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-white/45">
            <Icon d={ICONS.bell} size={14} />
            <span>
              {newestAt ? `Newest strategy: ${shortDate(newestAt)}` : "No recent strategy activity"}
            </span>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Icon d={ICONS.analytics} size={26} />}
          title="No trading data"
          description="Start trading with grid strategies to see your performance metrics"
        />
      )}
    </section>
  )
}

function RecentTradesPanel({ runs }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/90 p-5 shadow-[0_20px_60px_rgb(0_0_0_/_0.35)] sm:p-6">
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
        <p className="text-sm text-white/45">Latest executed trades from your grid strategies</p>
      </div>

      {runs.length === 0 ? (
        <EmptyState
          icon={<Icon d={ICONS.shield} size={26} />}
          title="No trades yet"
          description="Trades will appear here once your grid strategies execute orders"
        />
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              className="grid grid-cols-1 gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center md:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  Strategy {run.strategy_id ? String(run.strategy_id).slice(0, 8) : "Run"}
                </p>
                <p className="text-xs text-white/40">
                  {run.created_at ? shortDate(run.created_at) : "Unknown time"}
                </p>
              </div>
              <Metric label="CPU" value={`${integer(run.cpu_seconds ?? 0)}s`} />
              <Metric label="Wall" value={`${integer(run.wall_seconds ?? 0)}s`} />
              <Metric label="Cost" value={money(run.cost_cents ?? 0)} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, subtext }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-white">
        {value}
      </p>
      {subtext ? <p className="mt-1 text-xs text-white/40">{subtext}</p> : null}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center gap-2 text-xs md:justify-end">
      <span className="uppercase tracking-[0.16em] text-white/40">{label}</span>
      <span className="font-semibold tabular-nums text-white">{value}</span>
    </div>
  )
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-black/20 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.03] text-white/70">
        {icon}
      </div>
      <p className="text-2xl font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-xl text-sm text-white/45">{description}</p>
    </div>
  )
}

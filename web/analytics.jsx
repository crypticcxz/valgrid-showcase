import { useMemo } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { openaiUsage, strategyRuns } from "./data"
import { Icon, ICONS } from "./icons"
import { PageHeader } from "./layout"
import { integer, isActiveStrategy, money, monthYear, shortDate } from "./misc"

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
  const billing = useMemo(() => monthlyBilling(runs, usage), [runs, usage])

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        label="Dashboard"
        title="Analytics"
        description="Usage and activity at a glance."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          icon={<Icon d={ICONS.strategies} size={20} />}
          iconClass="bg-sky-500/10 text-sky-400"
          label="Strategies"
          value={active.length}
        />
        <Stat
          icon={<Icon d={ICONS.analytics} size={20} />}
          iconClass="bg-amber-500/10 text-amber-400"
          label="Runtime"
          value="On demand"
        />
        {createdAt && (
          <Stat
            icon={<Icon d={ICONS.bell} size={20} />}
            iconClass="bg-blue-500/10 text-blue-400"
            label="Newest"
            value={shortDate(createdAt)}
          />
        )}
      </div>

      <Billing billing={billing} />
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

function Billing({ billing }) {
  const cpu = billing?.cpu
  const openai = billing?.openai
  const month = billing?.month?.start_at
    ? monthYear(billing.month.start_at)
    : "This month"

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-white/50">
          Billing
        </p>
        <h3 className="mt-1 text-xl font-semibold text-white">{month}</h3>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Stat
          icon={<Icon d={ICONS.analytics} size={20} />}
          iconClass="bg-emerald-500/10 text-emerald-400"
          label="Total billed"
          value={billing ? money(billing.total_cost_cents) : "Loading"}
          subtext="CPU plus metered OpenAI usage"
        />
        <Stat
          icon={<Icon d={ICONS.play} size={20} />}
          iconClass="bg-amber-500/10 text-amber-400"
          label="CPU"
          value={cpu ? money(cpu.cost_cents) : "Loading"}
          subtext={
            cpu
              ? `${integer(cpu.seconds)} CPU seconds across ${integer(cpu.runs)} runs`
              : ""
          }
        />
        <Stat
          icon={<Icon d={ICONS.strategies} size={20} />}
          iconClass="bg-blue-500/10 text-blue-400"
          label="OpenAI"
          value={openai ? money(openai.cost_cents) : "Loading"}
          subtext={
            openai
              ? `${integer(openai.total_tokens)} tokens across ${integer(openai.requests)} chats`
              : ""
          }
        />
      </div>
    </section>
  )
}

function Stat({
  icon,
  iconClass = "bg-sky-500/10 text-sky-400",
  label,
  value,
  suffix,
  subtext,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#03111f] p-5 transition-all duration-300 hover:border-sky-500/30 hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgb(56_189_248_/_0.08)]">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-white/50">
            {label}
          </p>
          <div className="text-2xl font-bold tabular-nums tracking-tight text-white">
            {value}
            {suffix && (
              <span className="ml-1 text-sm font-normal text-white/40">
                {suffix}
              </span>
            )}
          </div>
          {subtext && <p className="text-xs text-white/40">{subtext}</p>}
        </div>
        {icon && (
          <div
            className={
              "flex h-11 w-11 items-center justify-center rounded-xl " +
              iconClass
            }
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

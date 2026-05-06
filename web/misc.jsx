export const AI_MODELS = [
  "gpt-5.5",
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5.2",
  "gpt-5.2-pro",
  "gpt-5.2-codex",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5.1",
  "gpt-5.1-codex",
  "gpt-5.1-codex-mini",
  "gpt-5",
  "gpt-5-pro",
  "gpt-5-codex",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",
  "o4-mini",
  "o3",
]

export const BLOCKCHAIN_NETWORKS = [
  { value: "devnet", label: "Devnet" },
  { value: "mainnet", label: "Mainnet" },
]
export const RUNTIME_RUNNING = "running"
export const RUNTIME_STOPPED = "stopped"
export const RUNTIME_STARTING = "starting"
export const RUNTIME_CRASHED = "crashed"
export const MESSAGE_PENDING = "pending"
export const MESSAGE_FAILED = "failed"

export function short(address) {
  if (!address) return "No wallet"
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export function nowIso() {
  return new Date().toISOString()
}

export function byTimeAsc(field) {
  return (a, b) => String(a?.[field]).localeCompare(String(b?.[field]))
}

export function byTimeDesc(field) {
  return (a, b) => String(b?.[field]).localeCompare(String(a?.[field]))
}

export function shortDate(value) {
  return new Date(value).toLocaleDateString()
}

export function clockTime(value) {
  return new Date(value).toLocaleTimeString()
}

export function dateTime(value) {
  return new Date(value).toLocaleString()
}

export function monthYear(value) {
  return new Date(value).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  })
}

export function relativeTime(value) {
  if (!value) return ""
  const d = new Date(value)
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return "now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function dateBucket(value) {
  if (!value) return "Older"
  const d = new Date(value)
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
  const dayMs = 86400000
  const diff = startOfToday.getTime() - d.getTime()
  if (d >= startOfToday) return "Today"
  if (diff < dayMs) return "Yesterday"
  if (diff < 7 * dayMs) return "Previous 7 days"
  if (diff < 30 * dayMs) return "Previous 30 days"
  return "Older"
}

export function money(cents) {
  if (cents === null || cents === undefined) return "Unavailable"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents < 1 ? 4 : 2,
  }).format(cents / 100)
}

export function integer(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "-"
  return new Intl.NumberFormat().format(number)
}

export function decimal(value, digits = 2) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "-"
  return number.toLocaleString(undefined, { maximumFractionDigits: digits })
}

export function signedDecimal(value, digits = 2) {
  const number = Number(value)
  if (!Number.isFinite(number) || number === 0) return "0.00"
  return `${number > 0 ? "+" : ""}${number.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  })}`
}

export function sol(value) {
  if (typeof value !== "number") return "-"
  return `${decimal(value, value >= 1 ? 4 : 6)} SOL`
}

export function lamportsToSol(lamports) {
  return lamports === null || lamports === undefined
    ? undefined
    : Number(lamports) / 1_000_000_000
}

export function isRefreshing(row) {
  if (!row?.balance_refresh_requested_at) return false
  if (!row.balance_refresh_finished_at) return true
  return (
    new Date(row.balance_refresh_requested_at).getTime() >
    new Date(row.balance_refresh_finished_at).getTime()
  )
}

export function isArchivedStrategy(strategy) {
  return Boolean(strategy?.archived_at)
}

export function isActiveStrategy(strategy) {
  return !isArchivedStrategy(strategy)
}

export function hasActiveRuntime(strategy) {
  const actual = strategy?.actual_runtime
  if (actual) {
    return actual === RUNTIME_RUNNING || actual === RUNTIME_STARTING
  }
  return strategy?.desired_runtime === RUNTIME_RUNNING
}

export function isPublicStrategy(strategy) {
  return Boolean(strategy?.is_public && isActiveStrategy(strategy))
}

export function isPendingMessage(message) {
  if (message?.status !== MESSAGE_PENDING) return false
  return Date.now() - new Date(message.created_at).getTime() < 2 * 60 * 1000
}

export function isFailedMessage(message) {
  return message?.status === MESSAGE_FAILED
}

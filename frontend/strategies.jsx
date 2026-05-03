import { useRef, useState } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { Link, useNavigate } from "react-router-dom"
import {
  archived,
  starred,
  updateFields,
} from "./collections"
import { createStrategy, runtime, strategyCopy } from "./data"
import { Icon, ICONS } from "./icons"
import {
  AI_MODELS,
  BLOCKCHAIN_NETWORKS,
  byTimeDesc,
  dateBucket,
  isActiveStrategy,
  isArchivedStrategy,
  hasActiveRuntime,
  relativeTime,
  short as shorten,
} from "./misc"
import { useToast } from "./toast"

function openNewStrategy(store, accountId, open) {
  const id = createStrategy(
    store,
    accountId,
    AI_MODELS[0],
    BLOCKCHAIN_NETWORKS[0].value,
  )
  open(id)
}

function duplicate(store, strategy) {
  const copy = strategyCopy(strategy, strategy.account_id, "(copy)", {
    public: strategy.is_public,
  })
  store.insert(copy)
  return copy.id
}

function StrategyStarButton({ collection, strategy, className = "", size = 14 }) {
  const active = strategy.is_starred
  return (
    <button
      type="button"
      onClick={() => starred(collection, strategy.id, !active)}
      className={
        className +
        (active ? " text-amber-200" : " text-white/40 hover:text-white")
      }
      aria-label={active ? "Unstar" : "Star"}
      title={active ? "Unstar" : "Star"}
    >
      <Icon d={ICONS.star} size={size} />
    </button>
  )
}

function StrategyRow({ strategy, active, store }) {
  const [confirmingArchive, setConfirmingArchive] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(strategy.name)
  const [tagging, setTagging] = useState(false)
  const [tag, setTag] = useState("")
  const cancelingTag = useRef(false)
  const navigate = useNavigate()
  const copy = () => duplicate(store, strategy)
  const running = hasActiveRuntime(strategy)
  const tags = strategy.tags
  const rename = () => {
    const value = name.trim()
    setEditing(false)
    if (!value || value === strategy.name) {
      setName(strategy.name)
      return
    }
    updateFields(store, strategy.id, { name: value })
  }
  const archive = () => {
    archived(store, strategy.id, true)
    setConfirmingArchive(false)
    if (active) navigate("/strategies", { replace: true })
  }
  const addTag = (e) => {
    e.preventDefault()
    if (cancelingTag.current) {
      cancelingTag.current = false
      return
    }
    const value = tag.trim().toLowerCase()
    if (value && !tags.includes(value)) {
      updateFields(store, strategy.id, { tags: [...tags, value] })
    }
    setTag("")
    setTagging(false)
  }
  const removeTag = (value) => {
    updateFields(store, strategy.id, {
      tags: tags.filter((tag) => tag !== value),
    })
  }

  return (
    <li
      className={
        "group relative flex items-center gap-1 rounded-lg border pl-3 pr-1 text-sm transition-colors " +
        (running
          ? active
            ? "border-emerald-400/25 bg-emerald-400/10 text-white"
            : "border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-100 hover:bg-emerald-400/[0.08]"
          : active
            ? "border-white/[0.06] bg-white/[0.06] text-white"
            : "border-transparent text-white/70 hover:bg-white/[0.03] hover:text-white")
      }
    >
      {!editing && !tagging && !confirmingArchive && (
        <Link
          to={`/strategies/${encodeURIComponent(strategy.id)}`}
          replace
          className="absolute inset-0 rounded-lg"
          aria-label={`Open ${strategy.name}`}
        />
      )}
      <div className="flex-1 min-w-0 py-2 text-left">
        <span className="flex items-center gap-2">
          {running && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
          )}
          {editing ? (
            <input
              autoFocus
              value={name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setName(e.target.value)}
              onBlur={rename}
              onKeyDown={(e) => {
                if (e.key === "Enter") rename()
                if (e.key === "Escape") {
                  setName(strategy.name)
                  setEditing(false)
                }
              }}
              className="min-w-0 flex-1 rounded bg-white/[0.04] px-1 text-sm text-white outline-none"
            />
          ) : (
            <Link
              to={`/strategies/${encodeURIComponent(strategy.id)}`}
              replace
              title={strategy.name}
              onDoubleClick={(e) => {
                e.preventDefault()
                setEditing(true)
              }}
              className="relative z-10 min-w-0 flex-1 truncate"
            >
              {strategy.name}
            </Link>
          )}
        </span>
        <span className="mt-1 flex min-w-0 flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded border border-white/[0.06] bg-white/[0.03] py-px pl-1.5 pr-0.5 text-[0.62rem] leading-none text-white/40"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="relative z-10 rounded px-1 text-white/25 hover:bg-white/[0.05] hover:text-white/70"
                aria-label={`Remove ${tag}`}
                title={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          {tagging ? (
            <form onSubmit={addTag} className="inline-flex">
              <input
                autoFocus
                value={tag}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setTag(e.target.value)}
                onBlur={addTag}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    cancelingTag.current = true
                    setTag("")
                    setTagging(false)
                  }
                }}
                placeholder="tag"
                className="h-5 w-16 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 text-[0.62rem] text-white outline-none placeholder:text-white/25"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setTagging(true)}
              className="relative z-10 rounded border border-dashed border-white/[0.08] px-1.5 py-px text-[0.62rem] leading-none text-white/30 hover:border-white/[0.16] hover:text-white/60"
            >
              + tag
            </button>
          )}
        </span>
      </div>
      <span className="text-[0.65rem] text-white/30 group-hover:hidden tabular-nums shrink-0 pr-2">
        {relativeTime(strategy.created_at)}
      </span>
      <div
        className={
          "relative z-10 items-center gap-0.5 shrink-0 " +
          (confirmingArchive ? "flex" : "hidden group-hover:flex")
        }
      >
        {confirmingArchive ? (
          <>
            <button
              type="button"
              onClick={archive}
              className="rounded px-1.5 py-1 text-[0.65rem] font-medium text-red-300 hover:bg-red-500/10"
              aria-label={`Confirm archive ${strategy.name}`}
              title="Confirm archive"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => setConfirmingArchive(false)}
              className="rounded p-1 text-white/40 hover:bg-white/[0.05] hover:text-white"
              aria-label="Cancel archive"
              title="Cancel"
            >
              <Icon d={ICONS.x} size={14} />
            </button>
          </>
        ) : (
          <>
            <StrategyStarButton
              collection={store}
              strategy={strategy}
              className="rounded p-1 hover:bg-white/[0.05]"
            />
            <button
              type="button"
              onClick={copy}
              className="rounded p-1 text-white/40 hover:bg-white/[0.05] hover:text-white"
              aria-label="Duplicate"
              title="Duplicate"
            >
              <Icon d={ICONS.clone} size={14} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmingArchive(true)}
              className="rounded p-1 text-white/40 hover:bg-red-500/10 hover:text-red-400"
              aria-label="Archive"
              title="Archive"
            >
              <Icon d={ICONS.archive} size={14} />
            </button>
          </>
        )}
      </div>
    </li>
  )
}

export function StrategySidebar({
  me,
  store,
  search,
  onSearch,
  unreadCount = 0,
  onSignOut,
  pathname,
  activeStrategy,
  onCollapse,
}) {
  const short = shorten(me.wallets?.[0]?.address)
  const navigate = useNavigate()
  const toast = useToast()
  const { data = [] } = useLiveQuery(store)
  const q = search.trim().toLowerCase()
  const active = data.filter(isActiveStrategy)
  const running = active.filter(hasActiveRuntime)
  const archived = data.filter(isArchivedStrategy).length
  const strategies = active
    .filter((strategy) => {
      if (!q) return true
      if (strategy.name?.toLowerCase().includes(q)) return true
      if (!strategy.tags) return false
      return strategy.tags.some((tag) => tag.toLowerCase().includes(q))
    })
    .sort(byTimeDesc("created_at"))
  const starred = strategies.filter((strategy) => strategy.is_starred)
  const unstarred = strategies.filter((strategy) => !strategy.is_starred)

  const groups = [
    "Today",
    "Yesterday",
    "Previous 7 days",
    "Previous 30 days",
    "Older",
  ]
    .map((label) => ({
      label,
      items: unstarred.filter(
        (strategy) => dateBucket(strategy.created_at) === label,
      ),
    }))
    .filter((group) => group.items.length > 0)
  const create = () => {
    openNewStrategy(store, me.id, (id) =>
      navigate(`/strategies/${encodeURIComponent(id)}`, { replace: true }),
    )
  }
  const stopAll = () => {
    for (const strategy of running) {
      runtime(store, strategy, RUNTIME_STOPPED)
    }
    toast(
      `Stop requested for ${running.length} ${running.length === 1 ? "strategy" : "strategies"}`,
      {
        variant: "success",
      },
    )
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-white/[0.08] bg-[#06050c]">
      <div className="flex items-center gap-2 p-3">
        <Link
          to="/strategies"
          replace
          className="flex min-w-0 flex-1 items-center gap-2 px-2 hover:opacity-80 transition-opacity"
        >
          <div className="h-8 w-8 rounded-lg bg-[#7BD0F9]/15 border border-[#7BD0F9]/35 flex items-center justify-center">
            <span className="text-[#7BD0F9] text-sm font-bold">V</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-white">
            Valgrid
          </span>
        </Link>
        <button
          type="button"
          onClick={onCollapse}
          className="rounded-lg p-2 text-white/40 hover:bg-white/[0.04] hover:text-white"
          aria-label="Hide sidebar"
          title="Hide sidebar"
        >
          <Icon d={ICONS.sidebar} size={15} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search strategies..."
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#7BD0F9]/50"
        />
      </div>
      {running.length > 0 && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={stopAll}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/15"
          >
            <Icon d={ICONS.stop} size={13} />
            Kill all running ({running.length})
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={create}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#7BD0F9]/35 bg-[#0094BC]/20 px-3 py-2 text-sm font-semibold text-[#B4F1FF] transition-all duration-200 hover:bg-[#0094BC]/35 hover:border-[#B4F1FF]/45 hover:shadow-[0_0_0_1px_rgb(180_241_255_/_0.08)]"
            >
              <Icon d={ICONS.plus} />
              <span>New strategy</span>
            </button>
          </li>
        </ul>
        {q && strategies.length === 0 && (
          <p className="px-3 py-2 text-xs text-white/40">No matches.</p>
        )}
        {starred.length > 0 && (
          <div>
            <p className="px-3 mb-1 text-[0.65rem] font-bold uppercase tracking-widest text-amber-200/60">
              Starred
            </p>
            <ul className="space-y-0.5">
              {starred.map((strategy) => (
                <StrategyRow
                  key={strategy.id}
                  strategy={strategy}
                  active={strategy.id === activeStrategy}
                  store={store}
                />
              ))}
            </ul>
          </div>
        )}
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((strategy) => (
                <StrategyRow
                  key={strategy.id}
                  strategy={strategy}
                  active={strategy.id === activeStrategy}
                  store={store}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <nav className="border-t border-white/[0.06] px-2 py-2 grid grid-cols-3 gap-1">
        {[
          { view: "home", label: "Home", icon: "home", path: "/" },
          {
            view: "wallets",
            label: "Wallets",
            icon: "wallets",
            path: "/wallets",
          },
          {
            view: "analytics",
            label: "Analytics",
            icon: "analytics",
            path: "/analytics",
          },
          {
            view: "notifications",
            label: "Inbox",
            icon: "bell",
            count: unreadCount,
            path: "/notifications",
          },
          { view: "profile", label: "Profile", icon: "star", path: "/profile" },
          {
            view: "archive",
            label: "Archive",
            icon: "archive",
            count: archived,
            path: "/archive",
          },
          {
            view: "settings",
            label: "Settings",
            icon: "shield",
            path: "/settings",
          },
        ].map((item) => {
          const active = pathname === item.path
          const badge = item.count > 0
          return (
            <Link
              key={item.view}
              to={item.path}
              replace
              title={item.label}
              aria-label={item.label}
              className={
                "relative flex flex-col items-center gap-1 rounded-lg py-2 text-[0.65rem] transition-colors " +
                (active
                  ? "bg-[#7BD0F9]/10 text-[#7BD0F9] border border-[#7BD0F9]/25"
                  : "text-white/50 hover:bg-white/[0.03] hover:text-white")
              }
            >
              <Icon d={ICONS[item.icon]} />
              <span>{item.label}</span>
              {badge && (
                <span className="absolute top-1 right-1 rounded-full bg-[#0094BC] px-1 py-px text-[0.55rem] font-bold leading-none text-white min-w-[1rem] text-center">
                  {item.count > 99 ? "99+" : item.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <Link
          to="/settings"
          replace
          className="flex items-center gap-3 mb-3 rounded-lg p-2 -m-2 hover:bg-white/[0.03] transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-[#7BD0F9]/10 border border-white/[0.08] flex items-center justify-center text-[#7BD0F9] text-sm font-medium">
            {short.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">
              {me.google_sub ? "Google account" : "Wallet account"}
            </p>
            <p className="text-xs text-white/50 truncate">{short}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] py-2 text-sm text-red-400 hover:bg-white/[0.03] transition-colors"
        >
          <Icon d={ICONS.logout} />
          Log out
        </button>
      </div>
    </aside>
  )
}

function ArchiveRow({ strategy, collection }) {
  const restore = () => {
    archived(collection, strategy.id, false)
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{strategy.name}</p>
        <p className="text-xs text-white/40">
          Archived {relativeTime(strategy.archived_at)}
        </p>
      </div>
      <button
        type="button"
        onClick={restore}
        className="rounded px-2 py-1 text-xs font-medium text-sky-300 hover:bg-white/[0.06]"
      >
        Restore
      </button>
    </li>
  )
}

function StrategyListRow({ strategy, collection, onOpen }) {
  const running = hasActiveRuntime(strategy)
  const tags = strategy.tags

  return (
    <li className="flex items-center">
      <button
        type="button"
        onClick={() => onOpen(strategy.id)}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span
          className={
            "h-2 w-2 shrink-0 rounded-full " +
            (running ? "bg-emerald-300" : "bg-white/20")
          }
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">
            {strategy.name}
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-2 text-xs text-white/35">
            <span className="shrink-0">
              {relativeTime(strategy.created_at)}
            </span>
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[0.62rem] leading-none text-white/40"
              >
                {tag}
              </span>
            ))}
          </span>
        </span>
      </button>
      <StrategyStarButton
        collection={collection}
        strategy={strategy}
        className="mr-3 rounded-lg p-2 transition-colors hover:bg-white/[0.05]"
        size={15}
      />
      <button
        type="button"
        onClick={() => onOpen(strategy.id)}
        className="mr-3 rounded-lg p-2 text-white/35 transition-colors hover:bg-white/[0.05] hover:text-white"
        aria-label={`Open ${strategy.name}`}
        title="Open"
      >
        <Icon d={ICONS.arrowRight} size={15} />
      </button>
    </li>
  )
}

export function Archive({ collection }) {
  const { data = [] } = useLiveQuery(collection)
  const strategies = data
    .filter(isArchivedStrategy)
    .sort(byTimeDesc("archived_at"))

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col justify-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
        <Icon d={ICONS.archive} size={24} />
      </div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
        Archive
      </h1>
      <p className="mb-8 text-sm text-white/50">
        Restore archived strategies without losing their code, messages, or wallet.
      </p>
      {strategies.length === 0 ? (
        <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/45">
          Archive is empty.
        </p>
      ) : (
        <ul className="space-y-2">
          {strategies.map((strategy) => (
            <ArchiveRow
              key={strategy.id}
              strategy={strategy}
              collection={collection}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export function Strategies({ me, collection, onOpen }) {
  const { data = [] } = useLiveQuery(collection)
  const active = data
    .filter(isActiveStrategy)
    .sort(byTimeDesc("created_at"))
  const recent = active.slice(0, 6)
  const create = () => openNewStrategy(collection, me.id, onOpen)

  return (
    <div className="-mx-4 -my-6 w-auto md:-mx-8 md:-my-8">
      <div className="flex min-h-[100dvh] flex-col overflow-hidden rounded-none border border-white/[0.08] border-l-0 bg-[#0b0a12]/75 backdrop-blur">
        <nav className="flex items-center justify-between border-b border-white/[0.08] bg-[#09080f]/90 px-5 py-3">
          <p className="text-sm font-semibold tracking-tight text-white">Strategies</p>
          <div className="flex items-center gap-2 sm:gap-3">
            {[
              { label: "Strategies", path: "/strategies" },
              { label: "Wallets", path: "/wallets" },
              { label: "Analytics", path: "/analytics" },
              { label: "Settings", path: "/settings" },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                replace
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 " +
                  (item.path === "/strategies"
                    ? "bg-[#7BD0F9]/12 text-[#B4F1FF] border border-[#7BD0F9]/25"
                    : "text-white/60 border border-transparent hover:border-white/[0.1] hover:bg-white/[0.03] hover:text-white")
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <section className="relative flex-1 px-5 py-0">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-8 h-56 w-56 -translate-x-1/2 rounded-full bg-[#B4F1FF]/20 blur-3xl" />
            <div className="absolute bottom-0 right-10 h-48 w-48 rounded-full bg-[#0094BC]/18 blur-3xl" />
          </div>
          <div className="relative mx-auto flex h-full min-h-[22rem] max-w-2xl flex-col items-center justify-center text-center">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.25em] text-[#B4F1FF]/75">
              Assistant
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Chat to start
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
              Start a new strategy conversation, generate code, and move straight
              into runtime from one place.
            </p>
            <button
              type="button"
              onClick={create}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-[#7BD0F9]/35 bg-[#0094BC]/20 px-8 py-3 text-sm font-semibold text-[#B4F1FF] transition-all duration-200 hover:bg-[#0094BC]/35 hover:border-[#B4F1FF]/45 hover:shadow-[0_0_0_1px_rgb(180_241_255_/_0.08)]"
            >
              <Icon d={ICONS.plus} size={14} />
              Start chat
            </button>
          </div>
        </section>

        <section className="border-t border-white/[0.08] px-5 py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
              Recent strategies
            </h3>
            <span className="text-xs text-white/35">{active.length} total</span>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-6 text-sm text-white/45">
              No strategies yet. Use Start chat to create your first one.
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-[#09080f]/65">
              {recent.map((strategy) => (
                <StrategyListRow
                  key={strategy.id}
                  strategy={strategy}
                  collection={collection}
                  onOpen={onOpen}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
      {active.length > 6 && (
        <div className="mt-3 text-xs text-white/35">
          Showing recent 6 strategies. Use the sidebar to browse all.
        </div>
      )}
    </div>
  )
}

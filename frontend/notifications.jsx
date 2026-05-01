import { useLiveQuery } from "@tanstack/react-db"
import { PageHeader } from "./layout"
import { byTimeDesc, clockTime, nowIso } from "./misc"

export function Notifications({ collection }) {
  const { data = [] } = useLiveQuery(collection)
  const sorted = [...data].sort(byTimeDesc("created_at"))
  const unread = sorted.filter((n) => !n.read_at)

  const read = () => {
    const now = nowIso()
    collection.update(
      unread.map((n) => n.id),
      (drafts) => {
        for (const draft of drafts) {
          draft.read_at = now
        }
      },
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        label="Inbox"
        title="Notifications"
        description={
          unread.length === 0 ? "All caught up." : `${unread.length} unread`
        }
      >
        {unread.length > 0 && (
          <button
            type="button"
            onClick={read}
            className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
          >
            Mark all read
          </button>
        )}
      </PageHeader>

      <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-[#03111f]">
        {sorted.length === 0 && (
          <li className="py-10 text-center text-sm text-white/40">
            No notifications yet.
          </li>
        )}
        {sorted.map((n) => (
          <li
            key={n.id}
            className={
              "flex items-start gap-3 px-4 py-3 " +
              (n.read_at ? "opacity-60" : "")
            }
          >
            <span
              className={
                "mt-1.5 h-2 w-2 shrink-0 rounded-full " +
                (n.read_at ? "bg-white/20" : "bg-sky-400")
              }
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{n.title}</p>
              {n.body && (
                <p className="text-xs text-white/50 mt-0.5 truncate font-mono">
                  {n.body}
                </p>
              )}
            </div>
            <span className="text-xs text-white/40 whitespace-nowrap">
              {clockTime(n.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

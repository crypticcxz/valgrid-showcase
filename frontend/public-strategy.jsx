import { useState } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { useNavigate } from "react-router-dom"
import { publicStrategy, strategies, strategyCopy } from "./data"

export function PublicStrategy({ account: accountId, id }) {
  const [error, setError] = useState(null)
  const [forking, setForking] = useState(false)
  const navigate = useNavigate()
  const shared = publicStrategy(id)
  const store = accountId ? strategies(accountId) : null
  const { data: rows = [] } = useLiveQuery(shared)
  const strategy = rows[0]

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#03111f] px-4 text-white">
        <div className="max-w-md text-center">
          <p className="text-sm text-white/45">Shared strategy</p>
          <h1 className="mt-2 text-2xl font-semibold">Strategy unavailable</h1>
          <p className="mt-2 text-sm text-white/50">
            This strategy is private or no longer exists.
          </p>
        </div>
      </main>
    )
  }

  if (!strategy) {
    return <main className="min-h-screen bg-[#03111f]" />
  }
  const fork = async () => {
    if (!accountId || !store) {
      navigate("/strategies", { replace: true })
      return
    }
    setForking(true)
    try {
      const fork = strategyCopy(strategy, accountId, "(fork)", {
        public: false,
      })
      store.insert(fork)
      navigate(`/strategies/${encodeURIComponent(fork.id)}`, {
        replace: true,
      })
    } catch (e) {
      setError(e?.message)
    } finally {
      setForking(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#03111f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-widest text-sky-300">
          Public strategy
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {strategy.name}
            </h1>
          </div>
          <button
            type="button"
            onClick={fork}
            disabled={forking}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {forking ? "Forking..." : "Fork to dashboard"}
          </button>
        </div>
        {strategy.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {strategy.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/[0.08] px-2 py-1 text-xs text-white/55"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {strategy.code && (
          <section className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">
              Python
            </h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-sky-950/30">
              <div className="border-b border-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/45">
                Code
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-6 text-white/75">
                <code>{strategy.code}</code>
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

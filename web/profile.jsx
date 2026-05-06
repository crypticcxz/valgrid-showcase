import { useLiveQuery } from "@tanstack/react-db"
import { Link } from "react-router-dom"
import { PageHeader } from "./layout"
import { isPublicStrategy, short } from "./misc"

export function Profile({ me, store }) {
  const { data: strategies = [] } = useLiveQuery(store)
  const shared = strategies.filter(isPublicStrategy)
  const starred = strategies.filter((strategy) => strategy.is_starred)
  const achievements = []
  if (shared.length > 0) achievements.push("Public builder")
  const title = me.google_sub
    ? "Google account"
    : me.wallets?.[0]?.address
      ? `Wallet ${short(me.wallets[0].address)}`
      : "Account"

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        label="Profile"
        title={title}
        description="Your public identity, achievements, and shared strategies."
      />

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
          Stats
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-amber-100/60">
              Starred strategies
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-100">
              {starred.length}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
          Achievements
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#03111f] p-5 text-sm text-white/45">
              No achievements yet.
            </div>
          ) : (
            achievements.map((achievement) => (
              <div
                key={achievement}
                className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5"
              >
                <p className="text-sm font-semibold text-amber-100">
                  {achievement}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
          Public strategies
        </h2>
        <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-[#03111f]">
          {shared.length === 0 ? (
            <div className="px-4 py-8 text-sm text-white/45">
              No public strategies yet.
            </div>
          ) : (
            shared.map((strategy) => (
              <Link
                key={strategy.id}
                to={`/share/strategies/${encodeURIComponent(strategy.id)}`}
                replace
                className="block px-4 py-3 hover:bg-white/[0.03]"
              >
                <p className="text-sm font-medium text-white">
                  {strategy.name}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

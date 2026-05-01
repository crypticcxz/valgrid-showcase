import { Link } from "react-router-dom"
import { Icon, ICONS } from "./icons"

export function Home() {
  return (
    <main className="min-h-screen bg-[#03111f] px-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="grid min-h-[72vh] items-center gap-10 py-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-sky-300">
              Automated grid trading on Solana
            </p>
            <h1 className="text-5xl font-bold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Build, run, and monitor trading strategies.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
              Valgrid gives strategy builders a focused workspace for Solana
              grid trading: templates, wallet-aware workflows, Python execution,
              and output without leaving the dashboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/strategies"
                replace
                className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
              >
                Go to dashboard
                <Icon d={ICONS.arrowRight} />
              </Link>
              <Link
                to="/wallets"
                replace
                className="rounded-lg border border-white/[0.1] px-5 py-3 text-sm font-medium text-white/75 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                Connect wallet
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-sky-950/30 p-4 shadow-2xl shadow-sky-950/20">
            <div className="rounded-xl border border-white/[0.08] bg-[#061625] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/35">
                    Strategy
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    SOL grid
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                  Ready
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Metric label="Range" value="$138-$164" />
                <Metric label="Levels" value="18" />
                <Metric label="Runtime" value="Manual" />
              </div>
              <div className="mt-4 rounded-lg border border-white/[0.08] bg-sky-950/40 p-3 font-mono text-xs leading-6 text-white/65">
                <p className="text-emerald-300">print("grid ready")</p>
                <p>runner exited code=0 signal=null</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 pb-10 md:grid-cols-3">
          {[
            {
              title: "Grid strategies",
              body: "Build automated price-range strategies from templates or your own Python code.",
            },
            {
              title: "Solana first",
              body: "Connect wallets, track strategy activity, and keep execution state close to your dashboard.",
            },
            {
              title: "Runtime output",
              body: "Run strategies on demand and inspect output, crashes, and notifications in one place.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/[0.08] bg-[#03111f] p-5"
            >
              <h2 className="text-base font-semibold text-white">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/50">
                {feature.body}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
      <p className="text-[0.65rem] uppercase tracking-widest text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

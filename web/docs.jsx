import { Link } from "react-router-dom"
import { PageHeader } from "./layout"
import { Icon, ICONS } from "./icons"

const WORKFLOW_STEPS = [
  {
    title: "Pick a strategy template",
    body: "Start in /strategies and choose a base workflow. Templates give you a fast structure so you are never starting from a blank file.",
    icon: ICONS.strategies,
  },
  {
    title: "Shape logic with AI chat",
    body: "Describe what you want to trade, your risk limits, and your execution rules. The assistant updates your strategy so you can iterate quickly.",
    icon: ICONS.send,
  },
  {
    title: "Edit code manually anytime",
    body: "Open the built-in editor to refine entries, exits, filters, and sizing. You can fully control the code, not just prompt it.",
    icon: ICONS.contract,
  },
  {
    title: "Run and validate behavior",
    body: "Use Run and Stop directly in strategy detail. Validate output, inspect runtime behavior, then adjust code or prompts and rerun.",
    icon: ICONS.play,
  },
]

const BEST_PRACTICES = [
  "Start with one simple template and one market before scaling complexity.",
  "Keep risk controls explicit, add position limits and fail-safe exits first.",
  "Use AI to accelerate drafts, then verify logic in the editor before running.",
  "Treat each run as feedback, refine, rerun, and promote only stable versions.",
]

export function DocsPage() {
  return (
    <main className="min-h-screen bg-[#06050c] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <PageHeader
            label="Docs"
            title="AI Strategy Workflow"
            description="Build, edit, and run trading bots from templates with AI and a full code editor."
          >
            <Link
              to="/strategies"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0094BC] px-6 text-sm font-semibold text-white shadow-[0_0_30px_rgb(0_148_188_/_0.25)] transition-all duration-300 hover:bg-[#00aad8] hover:shadow-[0_0_40px_rgb(123_208_249_/_0.35)]"
            >
              <span>Open Strategies</span>
              <Icon d={ICONS.arrowRight} size={14} />
            </Link>
          </PageHeader>

          <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/90 shadow-[0_20px_60px_rgb(0_0_0_/_0.35)]">
            <div className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                How Valgrid works
              </h2>
              <p className="mt-1 text-sm text-white/45">
                The fastest path from an idea to an executable bot.
              </p>
            </div>
            <div className="grid gap-0 divide-y divide-white/[0.06] md:grid-cols-2 md:divide-x md:divide-y-0">
              {WORKFLOW_STEPS.map((step) => (
                <article key={step.title} className="space-y-3 px-5 py-5 sm:px-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] text-[#7BD0F9]">
                    <Icon d={step.icon} size={18} />
                  </div>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  <p className="text-sm leading-6 text-white/50">{step.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/90 p-5 shadow-[0_20px_60px_rgb(0_0_0_/_0.35)] sm:p-6">
              <h3 className="text-lg font-semibold text-white">Best practices</h3>
              <ul className="mt-4 space-y-3">
                {BEST_PRACTICES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/55">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7BD0F9]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/90 p-5 shadow-[0_20px_60px_rgb(0_0_0_/_0.35)] sm:p-6">
              <h3 className="text-lg font-semibold text-white">What to expect next</h3>
              <p className="mt-3 text-sm leading-6 text-white/50">
                After you generate a strategy, the same workspace lets you iterate with AI chat, manual code edits, and runtime controls. This keeps planning, coding, and validation in one loop.
              </p>
              <div className="mt-5 rounded-xl border border-white/[0.08] bg-black/25 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Typical loop
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Prompt template -> inspect generated code -> edit manually -> run -> review output -> improve.
                </p>
              </div>
              <Link
                to="/strategies"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-full border border-white/[0.12] bg-[#06050c] px-5 text-sm font-semibold text-white/85 transition-colors hover:border-[#7BD0F9]/35 hover:bg-[#0f0d17] hover:text-white"
              >
                Go to Strategies
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

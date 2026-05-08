import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Icon, ICONS } from "./icons"

const DOCS = [
  {
    id: "about",
    group: "Getting Started",
    label: "About Valgrid",
    icon: ICONS.home,
    article: {
      kicker: "Docs",
      title: "About Valgrid",
      intro:
        "Valgrid is an AI-first strategy platform where you can start from templates, generate and refine trading logic with AI, edit code directly, and run bots from one workspace.",
      sections: [
        {
          title: "Platform overview",
          paragraphs: [
            "Valgrid is built for strategy creation and bot execution from one place, combining templates, AI-assisted iteration, and direct code editing.",
            "You keep full control of the code at every stage, so AI accelerates development while execution logic remains transparent.",
          ],
        },
        {
          title: "Core capabilities",
          paragraphs: [
            "Create strategies from template prompts, refine behavior through AI chat, and manually edit in the code editor before running.",
          ],
          bullets: [
            "Template-based start for faster setup",
            "AI-assisted strategy edits",
            "Manual code editor with full control",
            "Run and Stop controls in strategy detail",
          ],
        },
      ],
      nextId: "onboarding",
    },
  },
  {
    id: "onboarding",
    group: "Getting Started",
    label: "Onboarding",
    icon: ICONS.plus,
    article: {
      kicker: "Getting Started",
      title: "Onboarding",
      intro:
        "The fastest way to launch your first bot is to use a template in /strategies, then iterate with AI and manual edits.",
      sections: [
        {
          title: "Step-by-step",
          bullets: [
            "Open /strategies and start a new strategy conversation",
            "Select a template direction and send your prompt",
            "Review generated code and adjust risk rules",
            "Run, observe output, then refine and rerun",
          ],
        },
        {
          title: "First-run advice",
          paragraphs: [
            "Keep your initial strategy narrow and test one idea at a time. Strong risk limits and clear exits should be your first customization.",
          ],
        },
      ],
      nextId: "workflow",
    },
  },
  {
    id: "workflow",
    group: "Getting Started",
    label: "AI Strategy Workflow",
    icon: ICONS.send,
    article: {
      kicker: "Workflow",
      title: "AI Strategy Workflow",
      intro:
        "A practical loop for building bots in Valgrid is prompt, inspect, edit, run, and iterate.",
      sections: [
        {
          title: "Build loop",
          bullets: [
            "Prompt template -> AI generates strategy logic",
            "Inspect generated code and assumptions",
            "Manually edit entries, exits, and sizing",
            "Run the strategy and monitor behavior",
            "Use AI chat for targeted revisions, then rerun",
          ],
        },
        {
          title: "Why this loop works",
          paragraphs: [
            "You can move quickly without losing control. AI drafts logic, but your editor and runtime controls keep the final decision in your hands.",
          ],
        },
      ],
      nextId: "algorithms",
    },
  },
  {
    id: "algorithms",
    group: "Features",
    label: "Templates and Logic",
    icon: ICONS.strategies,
    article: {
      kicker: "Features",
      title: "Templates and Logic",
      intro:
        "Templates act as structured starting points. You can evolve each one into your own executable strategy.",
      sections: [
        {
          title: "How templates help",
          paragraphs: [
            "Templates reduce setup time and provide a clear baseline for AI edits. They are meant to be modified, not used blindly.",
          ],
          bullets: [
            "Faster first draft",
            "Clear strategy scaffolding",
            "Compatible with AI and manual editing",
          ],
        },
      ],
      nextId: "runtime",
    },
  },
  {
    id: "runtime",
    group: "Features",
    label: "Run and Runtime Control",
    icon: ICONS.play,
    article: {
      kicker: "Features",
      title: "Run and Runtime Control",
      intro:
        "Run and Stop controls let you validate behavior quickly and safely during iteration.",
      sections: [
        {
          title: "Before you run",
          bullets: [
            "Check risk limits and position sizing",
            "Validate assumptions in generated code",
            "Keep first runs constrained and measurable",
          ],
        },
        {
          title: "After you run",
          paragraphs: [
            "Review outcomes, inspect recent activity, then update your strategy through chat or direct code edits. Repeat until stable.",
          ],
        },
      ],
      nextId: "interactive-guide",
    },
  },
  {
    id: "interactive-guide",
    group: "Resources",
    label: "Interactive Guide",
    icon: ICONS.analytics,
    article: {
      kicker: "Resources",
      title: "Interactive Guide",
      intro:
        "Use this page as a practical map for strategy creation and iteration.",
      sections: [
        {
          title: "Suggested practice",
          bullets: [
            "Start with one template strategy",
            "Run short cycles and measure behavior",
            "Refine with focused AI prompts",
            "Promote only strategies with repeatable outcomes",
          ],
        },
      ],
      nextId: null,
    },
  },
]

export function DocsPage() {
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState("about")

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return DOCS
    return DOCS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.article.title.toLowerCase().includes(q),
    )
  }, [query])

  const docsByGroup = useMemo(() => {
    const map = new Map()
    for (const item of filteredDocs) {
      if (!map.has(item.group)) map.set(item.group, [])
      map.get(item.group).push(item)
    }
    return map
  }, [filteredDocs])

  const activeDoc =
    DOCS.find((item) => item.id === activeId) ??
    DOCS.find((item) => item.id === "about") ??
    DOCS[0]

  const nextDoc = activeDoc.article.nextId
    ? DOCS.find((item) => item.id === activeDoc.article.nextId) ?? null
    : null

  return (
    <main className="min-h-screen bg-[#06050c] text-white">
      <div className="border-b border-white/[0.06] px-4 py-3 md:px-6">
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2">
          <Link to="/" className="text-2xl font-semibold tracking-tight text-white">
            ValGrid
          </Link>
          <span className="text-xs text-white/35">Documentation</span>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/[0.06] bg-[#08070f]/70 md:min-h-[calc(100vh-57px)] md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:overflow-y-auto">
          <div className="space-y-5 px-3 py-4">
            <div className="rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2">
              <div className="flex items-center gap-2 text-white/45">
                <span className="text-xs">Q</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search docs..."
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/30"
                />
              </div>
            </div>

            {Array.from(docsByGroup.entries()).map(([group, items]) => (
              <section key={group} className="space-y-1.5">
                <h2 className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  {group}
                </h2>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(item.id)}
                        className={
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors " +
                          (item.id === activeDoc.id
                            ? "border border-[#7BD0F9]/30 bg-[#0094BC]/16 text-[#B4F1FF]"
                            : "border border-transparent text-white/60 hover:border-white/[0.08] hover:bg-white/[0.03] hover:text-white")
                        }
                      >
                        <Icon d={item.icon} size={13} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <div className="pt-8 text-[11px] text-white/25">© {new Date().getFullYear()} Valgrid</div>
          </div>
        </aside>

        <section className="px-5 py-7 sm:px-8 md:px-10 md:py-9">
          <article className="mx-auto max-w-[72ch]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              {activeDoc.article.kicker}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {activeDoc.article.title}
            </h1>
            <p className="mt-4 text-base leading-8 text-white/55">{activeDoc.article.intro}</p>

            <div className="mt-12 space-y-12">
              {activeDoc.article.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {section.title}
                  </h2>
                  {section.paragraphs
                    ? section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="mt-4 text-base leading-8 text-white/55">
                          {paragraph}
                        </p>
                      ))
                    : null}
                  {section.bullets ? (
                    <ul className="mt-4 space-y-2">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-base text-white/55">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7BD0F9]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            <div className="mt-12 border-t border-white/[0.08] pt-6">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/strategies"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/[0.12] bg-[#06050c] px-5 text-sm font-semibold text-white/85 transition-colors hover:border-[#7BD0F9]/35 hover:bg-[#0f0d17] hover:text-white"
                >
                  Open Strategies
                </Link>
                {nextDoc ? (
                  <button
                    type="button"
                    onClick={() => setActiveId(nextDoc.id)}
                    className="group inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-[#B4F1FF]"
                  >
                    <span>Next</span>
                    <span>{nextDoc.label}</span>
                    <Icon d={ICONS.arrowRight} size={13} />
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

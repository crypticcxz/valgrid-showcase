import { useEffect, useMemo, useRef, useState } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { charts, messages, runtime } from "./data"
import {
  archived,
  updateFields,
} from "./collections"
import {
  StrategyWalletBalanceBadge,
} from "./strategy-wallet"
import { TopPanel } from "./strategy-trades"
import { Icon, ICONS } from "./icons"
import { StrategyEditor } from "./strategy-editor"
import {
  ChatComposer,
  ChatMessages,
  markdown,
} from "./strategy-chat"
import {
  byTimeAsc,
  isActiveStrategy,
  isArchivedStrategy,
  isPendingMessage,
  hasActiveRuntime,
  RUNTIME_RUNNING,
  RUNTIME_STOPPED,
} from "./misc"
import { useToast } from "./toast"

const TRADINGVIEW_WIDGET_SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
let tradingViewPreloadPromise = null

export function StrategyDetail({ id, collection }) {
  const { data = [] } = useLiveQuery(collection)
  const strategy = data.find((s) => s.id === id)
  const [view, setView] = useState("chat")
  const [chatDraft, setChatDraft] = useState("")
  const [chartImportOpen, setChartImportOpen] = useState(false)
  const [chartImportSymbol, setChartImportSymbol] = useState("")
  const [expandedPanel, setExpandedPanel] = useState(null)
  const msg = messages(id)
  const { data: messageData = [] } = useLiveQuery(msg)
  const sortedMessages = useMemo(
    () => [...messageData].sort(byTimeAsc("created_at")),
    [messageData],
  )
  const lastMessages = useRef([])
  if (sortedMessages.length > 0) {
    lastMessages.current = sortedMessages
  }
  const visibleMessages =
    sortedMessages.length > 0 ? sortedMessages : lastMessages.current
  const assistantResponding = visibleMessages.some(
    (message) => message.role === "user" && isPendingMessage(message),
  )

  const chartStore = charts(id)
  const { data: chartRows = [] } = useLiveQuery(chartStore)
  const sortedCharts = useMemo(
    () => chartRows.filter(isActiveStrategy).sort(byTimeAsc("created_at")),
    [chartRows],
  )
  const isRunning = hasActiveRuntime(strategy)
  const showTemplates = visibleMessages.length === 0 && !chatDraft
  const canExplain = Boolean(strategy?.code?.trim()) && !assistantResponding

  const toast = useToast()
  const update = (patch) => {
    if (!strategy) return
    updateFields(collection, strategy.id, patch)
  }
  const updateCode = (code) => update({ code })
  const selectView = setView

  useEffect(() => {
    if (
      view === "chat" ||
      view === "wallet" ||
      view === "trades"
    ) {
      return
    }
    if (!sortedCharts.some((chart) => chart.id === view)) {
      setView("chat")
    }
  }, [view, sortedCharts])

  useEffect(() => {
    if (view !== "chat" && expandedPanel) {
      setExpandedPanel(null)
    }
  }, [view, expandedPanel])

  if (!strategy) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/50">
        Strategy not found.
      </div>
    )
  }
  if (isArchivedStrategy(strategy)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-white/55">This strategy is in archive.</p>
        <button
          type="button"
          onClick={() => update({ archived_at: null })}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          Restore
        </button>
      </div>
    )
  }

  const apply = (code) => {
    update({ code })
    toast("Applied to strategy", { variant: "success" })
  }

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      toast("Copied code", { variant: "success" })
    } catch {
      toast("Copy failed", { variant: "error" })
    }
  }

  const applyTemplate = (item) => {
    item.apply({
      strategy,
      strategyStore: collection,
      chartStore,
    })
    toast("Template applied", { variant: "success" })
  }

  const markdownComponents = markdown({ onApplyCode: apply, onCopyCode: copy })

  const run = async () => {
    try {
      const desired = isRunning ? RUNTIME_STOPPED : RUNTIME_RUNNING
      runtime(
        collection,
        strategy,
        desired,
        desired === RUNTIME_RUNNING ? strategy.code : undefined,
      )
      toast(desired === RUNTIME_RUNNING ? "Run requested" : "Stop requested", {
        variant: "success",
      })
    } catch (e) {
      toast(e.message, { variant: "error" })
    }
  }

  const send = (e) => {
    e.preventDefault()
    const text = String(chatDraft || "").trim()
    if (!text) return
    sendMessage(text)
    setChatDraft("")
  }

  const sendMessage = (content) => {
    msg.insert({
      id: crypto.randomUUID(),
      strategy_id: strategy.id,
      role: "user",
      content,
    })
  }

  const explain = () => {
    if (!canExplain) return
    selectView("chat")
    sendMessage(
      [
        "Explain this strategy.",
        "Cover what it does, what signals it uses, what orders it emits, the main risks, and what a user should check before running it.",
      ].join(" "),
    )
    toast("Explain requested", { variant: "success" })
  }

  const openChartImport = () => {
    setChartImportSymbol("")
    setChartImportOpen(true)
  }

  const closeChartImport = () => {
    setChartImportOpen(false)
  }

  const submitChartImport = (e) => {
    e.preventDefault()
    const value = String(chartImportSymbol || "").trim()
    if (!value) {
      toast("Enter a chart symbol or contract address", { variant: "error" })
      return
    }
    const chart = crypto.randomUUID()
    chartStore.insert({
      id: chart,
      strategy_id: strategy.id,
      account_id: strategy.account_id,
      title: value,
      contract_address: value,
    })
    setChartImportOpen(false)
    setChartImportSymbol("")
  }

  const removeChart = (chart) => {
    try {
      archived(chartStore, chart.id, true)
      if (view === chart.id) selectView("trades")
    } catch (e) {
      toast(e?.message || "Chart delete failed", { variant: "error" })
    }
  }

  const renameChart = (chart, title) => {
    updateFields(chartStore, chart.id, { title })
  }

  const togglePanelExpand = (panel) => {
    setExpandedPanel((current) => (current === panel ? null : panel))
  }
  const chartExpanded = expandedPanel === "chart"
  const chatExpanded = expandedPanel === "chat"
  const editorExpanded = expandedPanel === "editor"

  return (
    <div className="flex h-full min-w-0 flex-col">
      <section className="flex min-h-0 flex-1 flex-col">
        <StrategyTabs
          strategy={strategy}
          value={view}
          onChange={selectView}
          charts={sortedCharts}
          onAddChart={openChartImport}
          onRemoveChart={removeChart}
          onRenameChart={renameChart}
          running={isRunning}
          onVisibility={(isPublic) => update({ is_public: isPublic })}
          onRun={run}
          onExplain={explain}
          canExplain={canExplain}
        />
        {view === "chat" ? (
          <div className="min-h-0 flex-1 p-4 lg:p-5">
            <div
              className={
                "grid h-full min-h-0 gap-4 " +
                (expandedPanel
                  ? "lg:grid-cols-1"
                  : "lg:grid-cols-[minmax(0,1fr)_minmax(360px,42%)]")
              }
            >
              <div
                className={
                  "grid min-h-0 gap-4 " +
                  (chartExpanded
                    ? "lg:grid-rows-[minmax(0,1fr)_0px]"
                    : chatExpanded
                      ? "lg:grid-rows-[0px_minmax(0,1fr)]"
                      : "lg:grid-rows-[minmax(240px,44%)_minmax(0,56%)]") +
                  (editorExpanded ? " lg:hidden" : "")
                }
              >
                <section
                  className={
                    "min-h-[240px] overflow-hidden rounded-xl bg-[#081321]/70 transition-all " +
                    (chatExpanded ? "lg:min-h-0 lg:h-0" : "")
                  }
                >
                  <StrategyQuickChart
                    charts={sortedCharts}
                    expanded={chartExpanded}
                    onToggleExpand={() => togglePanelExpand("chart")}
                  />
                </section>
                <section
                  className={
                    "min-h-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#081321]/70 transition-all " +
                    (chartExpanded ? "lg:h-0 lg:min-h-0 lg:border-transparent" : "")
                  }
                >
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                        AI Chat
                      </p>
                      <PanelExpandButton
                        expanded={chatExpanded}
                        onClick={() => togglePanelExpand("chat")}
                      />
                    </div>
                    <ChatMessages
                      messages={visibleMessages}
                      markdownComponents={markdownComponents}
                      responding={assistantResponding}
                      onTemplate={applyTemplate}
                      showTemplates={showTemplates}
                    />
                    <ChatComposer
                      model={strategy.ai_model}
                      onModel={(model) => update({ ai_model: model })}
                      draft={chatDraft}
                      onDraft={setChatDraft}
                      onSend={send}
                    />
                  </div>
                </section>
              </div>
              <section
                className={
                  "min-h-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#081321]/70 " +
                  (chartExpanded || chatExpanded ? "lg:hidden" : "")
                }
              >
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Editor
                    </p>
                    <PanelExpandButton
                      expanded={editorExpanded}
                      onClick={() => togglePanelExpand("editor")}
                    />
                  </div>
                  <div className="min-h-0 flex-1">
                    <StrategyEditor
                      key={`editor:${strategy.id}`}
                      strategy={id}
                      reset={
                        strategy?.desired_runtime === RUNTIME_RUNNING
                          ? strategy.runtime_requested_at
                          : null
                      }
                      code={strategy.code}
                      onCode={updateCode}
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <TopPanel
            key={`charts:${strategy.id}`}
            strategy={strategy}
            charts={sortedCharts}
            tab={view}
            setTab={selectView}
          />
        )}
      </section>
      <ChartImport
        open={chartImportOpen}
        symbol={chartImportSymbol}
        onSymbol={setChartImportSymbol}
        onClose={closeChartImport}
        onSubmit={submitChartImport}
      />
    </div>
  )
}

function StrategyQuickChart({ charts, expanded, onToggleExpand }) {
  const chart = charts[0]
  const symbol = normalizeTradingViewSymbol(chart?.contract_address || "BINANCE:SOLUSDT")
  const container = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const target = container.current
    if (!target) return
    let cancelled = false
    let readyInterval
    let failTimeout
    setIsLoading(true)
    setLoadError(false)
    target.innerHTML = ""
    const widget = document.createElement("div")
    widget.className = "tradingview-widget-container__widget"
    widget.style.height = "100%"
    widget.style.width = "100%"
    const script = document.createElement("script")
    script.src = TRADINGVIEW_WIDGET_SRC
    script.type = "text/javascript"
    script.async = true
    script.onerror = () => {
      if (cancelled) return
      setLoadError(true)
      setIsLoading(false)
    }
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "30",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(2, 11, 20, 1)",
      gridColor: "rgba(255, 255, 255, 0.06)",
      allow_symbol_change: true,
      calendar: false,
      hide_side_toolbar: true,
      hide_top_toolbar: true,
      support_host: "https://www.tradingview.com",
    })
    const markReady = () => {
      if (cancelled) return
      setIsLoading(false)
      setLoadError(false)
      if (readyInterval) clearInterval(readyInterval)
      if (failTimeout) clearTimeout(failTimeout)
    }

    preloadTradingViewAssets().finally(() => {
      if (cancelled) return
      target.append(widget, script)
      readyInterval = window.setInterval(() => {
        if (target.querySelector("iframe")) {
          markReady()
        }
      }, 200)
      failTimeout = window.setTimeout(() => {
        if (cancelled) return
        setIsLoading(false)
        setLoadError(true)
      }, 12000)
    })

    return () => {
      cancelled = true
      if (readyInterval) clearInterval(readyInterval)
      if (failTimeout) clearTimeout(failTimeout)
      target.innerHTML = ""
    }
  }, [symbol])

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="absolute right-3 top-3 z-10">
        <PanelExpandButton expanded={expanded} onClick={onToggleExpand} />
      </div>
      <div className="min-h-0 flex-1 bg-[#020b14]">
        <div
          ref={container}
          className={
            "tradingview-widget-container h-full min-h-0 w-full overflow-hidden rounded-xl transition-opacity duration-300 " +
            (isLoading ? "opacity-0" : "opacity-100")
          }
        />
        {isLoading && <ChartLoadingSkeleton />}
        {loadError && !isLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-md border border-white/[0.08] bg-[#020b14]/80 px-3 py-2 text-xs text-white/60 backdrop-blur">
              Loading chart data...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChartLoadingSkeleton() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl bg-[#06050c]">
      <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-[#B4F1FF]/10 blur-3xl" />
      <div className="absolute -right-8 bottom-8 h-36 w-36 rounded-full bg-[#0094BC]/12 blur-3xl" />
      <div className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,rgba(255,255,255,0.01),rgba(123,208,249,0.06),rgba(255,255,255,0.01))]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#030b16]/95 via-[#030b16]/55 to-transparent" />
      <div className="absolute left-4 top-4 h-2 w-24 rounded bg-[#B4F1FF]/28" />
      <div className="absolute left-4 top-8 h-2 w-36 rounded bg-[#7BD0F9]/18" />
      <div className="absolute left-4 top-[42%] h-px w-[86%] bg-[#7BD0F9]/18" />
      <div className="absolute left-4 top-[62%] h-px w-[78%] bg-[#7BD0F9]/14" />
      <div className="absolute left-4 top-[78%] h-px w-[64%] bg-[#7BD0F9]/10" />
      <div className="absolute bottom-3 right-4 rounded border border-white/[0.08] bg-[#030d1a]/80 px-2 py-1 text-[0.62rem] font-medium text-[#B4F1FF]/75 backdrop-blur">
        Loading SOL chart...
      </div>
    </div>
  )
}

function preloadTradingViewAssets() {
  if (typeof document === "undefined") return Promise.resolve()
  if (tradingViewPreloadPromise) return tradingViewPreloadPromise
  tradingViewPreloadPromise = Promise.resolve().then(() => {
    const ensureLink = (id, rel, href, as) => {
      if (document.getElementById(id)) return
      const link = document.createElement("link")
      link.id = id
      link.rel = rel
      link.href = href
      if (as) link.as = as
      document.head.appendChild(link)
    }
    ensureLink("tv-preconnect-main", "preconnect", "https://www.tradingview.com")
    ensureLink("tv-preconnect-s3", "preconnect", "https://s3.tradingview.com")
    ensureLink("tv-preload-script", "preload", TRADINGVIEW_WIDGET_SRC, "script")
  })
  return tradingViewPreloadPromise
}

function PanelExpandButton({ expanded, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#7BD0F9]/55 bg-[#0094BC]/35 text-[#B4F1FF] shadow-[0_0_0_1px_rgb(180_241_255_/_0.15),0_8px_18px_rgb(0_148_188_/_0.25)] transition-colors hover:bg-[#0094BC]/50 hover:border-[#B4F1FF]/65 hover:text-[#E1F8FF]"
      aria-label={expanded ? "Contract panel" : "Expand panel"}
      title={expanded ? "Contract" : "Expand"}
    >
      <Icon d={expanded ? ICONS.contract : ICONS.expand} size={12} />
    </button>
  )
}

function normalizeTradingViewSymbol(input) {
  const raw = String(input || "").trim().toUpperCase()
  if (!raw) return "BINANCE:SOLUSDT"
  if (raw.includes(":")) return raw.replace(/\s+/g, "")
  const pair = raw.match(/^([A-Z0-9]+)\s*\/\s*([A-Z0-9]+)$/)
  if (pair) return `BINANCE:${pair[1]}${pair[2]}`
  return raw
}

function StrategyTabs({
  strategy,
  value,
  onChange,
  charts,
  onAddChart,
  onRemoveChart,
  onRenameChart,
  running,
  onVisibility,
  onRun,
  onExplain,
  canExplain,
}) {
  const toast = useToast()
  const shareUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/share/strategies/${encodeURIComponent(strategy.id)}`

  const share = async () => {
    if (!strategy.is_public) {
      onVisibility(true)
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast("Share link copied", { variant: "success" })
    } catch {
      toast(shareUrl, { variant: "success" })
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2 lg:px-6">
      <div className="flex min-w-0 overflow-x-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
        <StrategyTab active={value === "chat"} onClick={() => onChange("chat")}>
          Chat
        </StrategyTab>
        <StrategyTab
          active={value === "trades"}
          onClick={() => onChange("trades")}
        >
          Trades
        </StrategyTab>
        <StrategyTab
          active={value === "wallet"}
          onClick={() => onChange("wallet")}
        >
          Wallet
        </StrategyTab>
        {charts.map((chart) => (
          <div
            key={chart.id}
            className={
              "flex shrink-0 items-center rounded-md transition-colors " +
              (value === chart.id
                ? "bg-white/[0.08] text-white"
                : "text-white/45 hover:text-white")
            }
          >
            <label className="inline-grid max-w-80">
              <span
                className="invisible col-start-1 row-start-1 whitespace-pre px-3 py-1.5 text-xs font-medium"
                aria-hidden="true"
              >
                {chart.title}
              </span>
              <input
                size={1}
                value={chart.title}
                onClick={() => onChange(chart.id)}
                onChange={(event) => onRenameChart(chart, event.target.value)}
                className="col-start-1 row-start-1 w-full min-w-0 bg-transparent px-3 py-1.5 text-xs font-medium text-inherit outline-none"
                aria-label="Chart title"
              />
            </label>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onRemoveChart(chart)
              }}
              className="mr-1 rounded p-1 text-white/30 hover:bg-red-500/10 hover:text-red-300"
              aria-label={`Remove ${chart.title}`}
              title="Remove chart"
            >
              <Icon d={ICONS.x} size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAddChart}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-sky-300 transition-colors hover:bg-white/[0.05] hover:text-sky-200"
          aria-label="Import chart"
          title="Import chart"
        >
          <Icon d={ICONS.plus} size={12} />
          Import chart
        </button>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <StrategyWalletBalanceBadge strategy={strategy} />
        <button
          type="button"
          onClick={() => onVisibility(!strategy.is_public)}
          className={
            "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors " +
            (strategy.is_public
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
              : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white")
          }
        >
          {strategy.is_public ? "Public" : "Private"}
        </button>
        <button
          type="button"
          onClick={share}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-white/[0.06] hover:text-white"
        >
          Share
        </button>
        <button
          type="button"
          onClick={onExplain}
          disabled={!canExplain}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          title={canExplain ? "Explain strategy" : "Add strategy code first"}
        >
          Explain
        </button>
        <button
          type="button"
          onClick={onRun}
          className={
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors " +
            (running
              ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
              : "bg-sky-600 text-white hover:bg-sky-500")
          }
        >
          <Icon d={running ? ICONS.stop : ICONS.play} size={13} />
          {running ? "Stop" : "Run"}
        </button>
      </div>
    </div>
  )
}

function StrategyTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex shrink-0 items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
        (active
          ? "bg-white/[0.08] text-white"
          : "text-white/45 hover:text-white")
      }
    >
      {children}
    </button>
  )
}

function ChartImport({
  open,
  symbol,
  onSymbol,
  onClose,
  onSubmit,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020b14]/75 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#03111f] p-4 shadow-2xl shadow-sky-950/30"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Import chart</h2>
            <p className="mt-1 text-xs leading-5 text-white/40">
              Add a chart tab from a TradingView symbol or contract address.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white/35 hover:bg-white/[0.05] hover:text-white"
            aria-label="Close import chart"
            title="Close"
          >
            <Icon d={ICONS.x} size={15} />
          </button>
        </div>

        <label className="block text-xs font-medium text-white/45">
          Symbol or contract
          <input
            autoFocus
            value={symbol}
            onChange={(e) => onSymbol(e.target.value)}
            placeholder="Symbol or contract"
            className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-sky-500/40"
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/55 hover:bg-white/[0.06] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500"
          >
            Import chart
          </button>
        </div>
      </form>
    </div>
  )
}

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
            {expandedPanel === "chart" ? (
              <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#081321]/70">
                <StrategyQuickChart
                  charts={sortedCharts}
                  expanded
                  onToggleExpand={() => togglePanelExpand("chart")}
                />
              </section>
            ) : expandedPanel === "chat" ? (
              <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#081321]/70">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                      AI Chat
                    </p>
                    <PanelExpandButton
                      expanded
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
            ) : expandedPanel === "editor" ? (
              <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#081321]/70">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Editor
                  </p>
                  <PanelExpandButton
                    expanded
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
              </section>
            ) : (
              <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,42%)]">
                <div className="grid min-h-0 gap-4 lg:grid-rows-[minmax(240px,44%)_minmax(0,56%)]">
                  <section className="min-h-[240px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#081321]/70">
                    <StrategyQuickChart
                      charts={sortedCharts}
                      expanded={false}
                      onToggleExpand={() => togglePanelExpand("chart")}
                    />
                  </section>
                  <section className="min-h-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#081321]/70">
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                          AI Chat
                        </p>
                        <PanelExpandButton
                          expanded={false}
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
                <section className="min-h-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#081321]/70">
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Editor
                      </p>
                      <PanelExpandButton
                        expanded={false}
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
            )}
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
  const title = chart?.title || "SOL/USDT"
  const symbol = normalizeTradingViewSymbol(chart?.contract_address || "BINANCE:SOLUSDT")
  const container = useRef(null)

  useEffect(() => {
    const target = container.current
    if (!target) return
    target.innerHTML = ""
    const widget = document.createElement("div")
    widget.className = "tradingview-widget-container__widget"
    widget.style.height = "100%"
    widget.style.width = "100%"
    const script = document.createElement("script")
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
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
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      support_host: "https://www.tradingview.com",
    })
    target.append(widget, script)
    return () => {
      target.innerHTML = ""
    }
  }, [symbol])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Crypto chart
          </p>
          <p className="mt-0.5 text-xs text-white/35">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[0.62rem] font-mono text-[#B4F1FF]">
            {symbol}
          </span>
          <PanelExpandButton expanded={expanded} onClick={onToggleExpand} />
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-[#020b14] p-2">
        <div
          ref={container}
          className="tradingview-widget-container h-full min-h-0 w-full overflow-hidden rounded-lg border border-white/[0.05]"
        />
      </div>
    </div>
  )
}

function PanelExpandButton({ expanded, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
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

import { useEffect, useMemo, useRef } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { trades } from "./data"
import { Icon, ICONS } from "./icons"
import {
  byTimeAsc,
  clockTime,
  dateTime,
  decimal,
  signedDecimal,
} from "./misc"
import { StrategyWalletView } from "./strategy-wallet"

export function TopPanel({
  strategy,
  charts,
  tab: selectedTab,
  setTab: setSelectedTab,
}) {
  const trade = trades(strategy.id)
  const { data: rows = [] } = useLiveQuery(trade)
  const activeTrades = useMemo(
    () =>
      [...rows]
        .map(normalize)
        .filter(Boolean)
        .sort(byTimeAsc("time")),
    [rows],
  )
  const tab = selectedTab || "trades"
  useEffect(() => {
    if (
      tab !== "trades" &&
      tab !== "wallet" &&
      !charts.some((chart) => chart.id === tab)
    ) {
      setSelectedTab("trades")
    }
  }, [charts, setSelectedTab, tab])
  const activeChart = charts.find((chart) => chart.id === tab)
  return (
    <div className="min-h-0 flex-1 overflow-hidden bg-sky-950/10">
      {tab === "wallet" ? (
        <StrategyWalletView strategy={strategy} />
      ) : activeChart && tab !== "trades" ? (
        <ContractChart
          chart={activeChart}
          trades={tradesForChart(activeChart, activeTrades)}
        />
      ) : (
        <TradesView trades={activeTrades} strategy={strategy} />
      )}
    </div>
  )
}

function chartSymbol(chart) {
  return String(chart.contract_address).trim()
}

function chartUrl(chart) {
  const symbol = chartSymbol(chart)
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`
}

function chartTerms(chart) {
  return chartSymbol(chart)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
}

function tradesForChart(chart, trades) {
  const terms = chartTerms(chart)
  if (terms.length === 0) return trades
  const matched = trades.filter((trade) => {
    const base = String(trade.base_symbol || trade.symbol || "").toUpperCase()
    const quote = String(trade.quote_symbol || "").toUpperCase()
    if (!base) return false
    if (!terms.some((term) => term.includes(base) || base.includes(term))) {
      return false
    }
    return (
      !quote || terms.some((term) => term.includes(quote) || quote.includes(term))
    )
  })
  return matched.length > 0 ? matched : trades
}

function TradingViewChart({ chart }) {
  const container = useRef(null)
  const symbol = chartSymbol(chart)

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
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(0, 0, 0, 0)",
      gridColor: "rgba(255, 255, 255, 0.06)",
      allow_symbol_change: true,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    })
    target.append(widget, script)
    return () => {
      target.innerHTML = ""
    }
  }, [symbol])

  return (
    <div
      ref={container}
      className="tradingview-widget-container min-h-0 flex-1"
    />
  )
}

function ContractChart({ chart, trades = [] }) {
  const symbol = chartSymbol(chart)
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#020b14]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] bg-white/[0.015] px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[0.7rem] font-medium uppercase tracking-widest text-white/35"
            title={chart.title}
          >
            {chart.title}
          </p>
          <p className="truncate font-mono text-[0.68rem] text-white/30">{symbol}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={chartUrl(chart).replace("?embed=1&theme=dark", "")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 items-center gap-1.5 rounded border border-white/[0.07] px-2 text-xs text-white/55 hover:bg-white/[0.04] hover:text-white"
          >
            <Icon d={ICONS.external} size={13} />
            Open
          </a>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <TradingViewChart chart={chart} />
        <ChartTradeOverlay trades={trades} />
      </div>
    </div>
  )
}

function ChartTradeOverlay({ trades }) {
  const recent = trades.slice(-18)
  if (recent.length === 0) return null
  const buys = recent.filter((trade) => trade.side === "buy").length
  const sells = recent.length - buys
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
      <div className="bg-gradient-to-t from-[#020b14]/90 via-[#020b14]/45 to-transparent px-4 pb-3 pt-10">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="rounded-full border border-white/[0.07] bg-[#020b14]/75 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-widest text-white/40 shadow-lg backdrop-blur">
            Wallet trades
          </div>
          <div className="rounded-full border border-white/[0.07] bg-[#020b14]/75 px-2.5 py-1 font-mono text-[0.65rem] shadow-lg backdrop-blur">
            <span className="text-emerald-300">{buys}B</span>
            <span className="mx-1.5 text-white/20">/</span>
            <span className="text-red-300">{sells}S</span>
          </div>
        </div>
        <div className="flex h-5 items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#020b14]/70 px-2 shadow-lg backdrop-blur">
          {recent.map((trade, index) => (
            <TradeMarker
              key={trade.id}
              trade={trade}
              index={index}
              count={recent.length}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TradeMarker({ trade, index, count }) {
  const sideClass =
    trade.side === "buy"
      ? "bg-emerald-300 shadow-[0_0_12px_rgb(110_231_183_/_0.35)]"
      : "bg-red-300 shadow-[0_0_12px_rgb(252_165_165_/_0.32)]"
  const width = `${100 / Math.max(count, 1)}%`
  return (
    <div
      className="pointer-events-auto flex min-w-0 justify-center"
      style={{ width }}
      title={[
        `${trade.side.toUpperCase()} ${trade.symbol}`,
        `price ${format(trade.price, 4)}`,
        `size ${format(trade.quantity, 6)}`,
        dateTime(trade.time),
      ].join(" | ")}
    >
      <div
        className={
          "h-2.5 w-2.5 rounded-full ring-2 ring-[#020b14] transition-transform hover:scale-150 " +
          sideClass
        }
        style={{
          transform: `translateY(${index % 2 === 0 ? 0 : -3}px)`,
        }}
      />
    </div>
  )
}

function TradesView({ trades, strategy }) {
  if (trades.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-white/30">
        Print a structured
        <span className="mx-1 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-white/45">
          trade
        </span>
        event to populate the chart.
      </div>
    )
  }

  const recent = trades.slice(-200)
  const walletUrl = explorer(strategy.strategy_wallet_address, strategy.blockchain_network)
  return (
    <div className="flex h-full min-h-0 flex-col bg-sky-950/20">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-widest text-white/35">
          Trades
        </p>
        {walletUrl && (
          <a
            href={walletUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-white/[0.08] px-2 py-1 text-xs text-white/60 hover:bg-white/[0.04] hover:text-white"
          >
            <Icon d={ICONS.external} size={13} />
            Explorer
          </a>
        )}
      </div>
      <Chart trades={recent} />
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/[0.06]">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[#061625] text-white/35">
            <tr>
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Side</th>
              <th className="px-3 py-2 font-medium">Symbol</th>
              <th className="px-3 py-2 text-right font-medium">Price</th>
              <th className="px-3 py-2 text-right font-medium">Size</th>
              <th className="px-3 py-2 text-right font-medium">PnL</th>
              <th className="px-3 py-2 text-right font-medium">External</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {[...recent].reverse().map((trade) => (
              <tr key={trade.id} className="text-white/70">
                <td className="px-3 py-2 text-white/40">
                  {clockTime(trade.time)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "rounded px-1.5 py-0.5 text-[0.65rem] uppercase " +
                      side(trade.side)
                    }
                  >
                    {trade.side}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">{trade.symbol}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {format(trade.price, 4)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {format(trade.quantity, 6)}
                </td>
                <td
                  className={
                    "px-3 py-2 text-right font-mono " + pnl(trade.pnl)
                  }
                >
                  {signed(trade.pnl)}
                </td>
                <td className="px-3 py-2 text-right">
                  {trade.tx_signature ? (
                    <a
                      href={explorer(
                        trade.tx_signature,
                        strategy.blockchain_network,
                        "tx",
                      )}
                      target="_blank"
                      rel="noreferrer"
                      title="View transaction"
                      className="inline-flex items-center justify-center rounded border border-white/[0.08] p-1 text-white/45 hover:bg-white/[0.04] hover:text-white"
                    >
                      <Icon d={ICONS.external} size={13} />
                    </a>
                  ) : (
                    <span className="text-white/20">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Chart({ trades }) {
  const width = 1000
  const height = 250
  const values = trades.map((trade) => trade.price)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || Math.max(max, 1)
  const x = (index) =>
    40 + (index / Math.max(trades.length - 1, 1)) * (width - 80)
  const y = (price) => 20 + (1 - (price - min) / range) * (height - 56)
  const path = trades
    .map(
      (trade, index) =>
        `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(trade.price).toFixed(1)}`,
    )
    .join(" ")
  const totalPnl = trades.reduce((sum, trade) => sum + Number(trade.pnl), 0)
  const buys = trades.filter((trade) => trade.side === "buy").length
  const sells = trades.filter((trade) => trade.side === "sell").length

  return (
    <div className="flex min-h-[300px] flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/35">
            Trade price
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {decimal(trades.at(-1)?.price, 4)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right text-xs">
          <Metric label="Buys" value={buys} />
          <Metric label="Sells" value={sells} />
          <Metric
            label="PnL"
            value={signedDecimal(totalPnl)}
            tone={totalPnl >= 0 ? "good" : "bad"}
          />
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="min-h-0 flex-1"
      >
        {[0.25, 0.5, 0.75].map((line) => (
          <line
            key={line}
            x1="40"
            x2={width - 40}
            y1={line * height}
            y2={line * height}
            stroke="rgb(255 255 255 / 0.06)"
          />
        ))}
        <path
          d={path}
          fill="none"
          stroke="rgb(125 211 252)"
          strokeWidth="2.5"
        />
        {trades.map((trade, index) => (
          <g key={trade.id}>
            <circle
              cx={x(index)}
              cy={y(trade.price)}
              r="7"
              fill={trade.side === "buy" ? "rgb(34 197 94)" : "rgb(239 68 68)"}
              stroke="rgb(3 17 31)"
              strokeWidth="3"
            />
            <path
              d={trade.side === "buy" ? "M-4 1 0 -4 4 1" : "M-4 -1 0 4 4 -1"}
              transform={`translate(${x(index)} ${y(trade.price)})`}
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
        <text x="42" y="16" fill="rgb(255 255 255 / 0.35)" fontSize="18">
          {decimal(max, 4)}
        </text>
        <text
          x="42"
          y={height - 8}
          fill="rgb(255 255 255 / 0.35)"
          fontSize="18"
        >
          {decimal(min, 4)}
        </text>
      </svg>
    </div>
  )
}

const tones = {
  good: "text-emerald-300",
  bad: "text-red-300",
  neutral: "text-white",
}

function Metric({ label, value, tone = "neutral" }) {
  const toneClass = tones[tone] ?? tones.neutral
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <p className="text-[0.65rem] uppercase tracking-widest text-white/35">
        {label}
      </p>
      <p className={"mt-1 font-mono text-sm " + toneClass}>{value}</p>
    </div>
  )
}

function normalize(row) {
  const price = Number(row.price)
  if (!Number.isFinite(price)) return null
  const side = String(row.side).toLowerCase()
  const normalizedSide = side.includes("sell") ? "sell" : "buy"
  return {
    id: row.id,
    time: row.executed_at,
    side: normalizedSide,
    symbol: row.base_symbol,
    base_symbol: row.base_symbol,
    quote_symbol: row.quote_symbol,
    price,
    quantity: number(row.quantity),
    value: number(row.quote_quantity),
    pnl: number(row.realized_pnl_quote),
    tx_signature: row.tx_signature,
  }
}

function number(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return value
  return number
}

function side(side) {
  return side === "buy"
    ? "bg-emerald-400/10 text-emerald-300"
    : "bg-red-400/10 text-red-300"
}

function pnl(value) {
  const number = Number(value)
  if (number > 0) return "text-emerald-300"
  if (number < 0) return "text-red-300"
  return "text-white/45"
}

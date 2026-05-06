import express from "express"
import path from "node:path"
import { accountEnvVarRoutes } from "./account-env-vars.jsx"
import { accountRoutes } from "./account.jsx"
import { authRoutes } from "./auth.jsx"
import { notificationRoutes } from "./notifications.jsx"
import { strategyChartRoutes } from "./strategy-charts.jsx"
import { failStaleChatMessages, strategyChatRoutes } from "./strategy-chat.jsx"
import { strategyReconcilerRoutes } from "./strategy-reconciler.jsx"
import { stopStaleStrategyRuntime, strategyRoutes } from "./strategy.jsx"
import { reconcileWalletRefreshes, walletRoutes } from "./wallet.jsx"

const app = express()
const port = 3001
const host = "0.0.0.0"
const dist = path.join(process.cwd(), "dist")

app.use(express.json())

app.use(
  "/api",
  authRoutes,
  accountRoutes,
  accountEnvVarRoutes,
  walletRoutes,
  notificationRoutes,
  strategyChartRoutes,
  strategyChatRoutes,
  strategyReconcilerRoutes,
  strategyRoutes,
)

app.use(express.static(dist, { index: false }))

app.use((req, res, next) => {
  if (req.method !== "GET" || !req.accepts("html")) return next()
  res.sendFile(path.join(dist, "index.html"))
})

app.use((err, req, res, _next) => {
  console.error(err)
  const message = err && err.message ? err.message : "internal server error"
  const status = Number.isInteger(err.status) ? err.status : 500
  res.status(status).json({ error: message })
})

app.listen(port, host, () => {
  console.log(`backend listening on http://${host}:${port}`)
  stopStaleStrategyRuntime().catch((e) =>
    console.error("strategy runtime cleanup failed:", e),
  )
  reconcileWalletRefreshes().catch((e) =>
    console.error("wallet refresh reconciliation failed:", e),
  )
  failStaleChatMessages().catch((e) =>
    console.error("chat cleanup failed:", e),
  )
})

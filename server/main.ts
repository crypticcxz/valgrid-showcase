import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { authMiddleware } from "./middleware/auth.ts"
import authRoutes from "./routes/auth.ts"
import deploymentRoutes from "./routes/deployments.ts"
import { startLogCollector } from "./services/logCollector.ts"
import { startMonitor } from "./services/monitor.ts"

const ELECTRIC_ORIGIN = process.env.ELECTRIC_URL ?? "http://localhost:3000"

const app = new Hono()

app.use("*", logger())
app.use("*", cors())

app.get("/api/health", (c) => c.json({ ok: true, service: "valgrid" }))

// Electric SQL shape proxy - transparent passthrough to Electric sync service
app.all("/api/electric/v1/shape", async (c) => {
	const url = new URL(c.req.url)
	const target = `${ELECTRIC_ORIGIN}/v1/shape${url.search}`
	const upstream = await fetch(target, {
		method: c.req.method,
		headers: c.req.raw.headers,
	})
	return new Response(upstream.body, {
		status: upstream.status,
		headers: upstream.headers,
	})
})

app.route("/api/auth", authRoutes)

app.use("/api/deployments/*", authMiddleware)
app.route("/api/deployments", deploymentRoutes)

const port = Number(process.env.PORT ?? 3001)

console.log(`[valgrid] starting server on port ${port}`)
serve({ fetch: app.fetch, port })

startMonitor()
startLogCollector()

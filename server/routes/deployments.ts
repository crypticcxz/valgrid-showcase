import { mkdir } from "node:fs/promises"
import path from "node:path"
import { and, eq } from "drizzle-orm"
import { Hono } from "hono"
import { nanoid } from "nanoid"
import type {
	CreateDeploymentRequest,
	UpdateDeploymentRequest,
} from "../../shared/types.ts"
import { buildDeploymentImage } from "../services/builder.ts"
import {
	createAndStartContainer,
	getContainerLogs,
	getContainerStats,
	removeContainer,
	stopContainer,
} from "../services/container.ts"
import { db, schema } from "../services/db/index.ts"
import { getEnvVars, getRestartPolicy } from "../services/deploymentHelpers.ts"
import { logEvent } from "../services/events.ts"
import type { AppEnv } from "../types.ts"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/tmp/valgrid-uploads"

const app = new Hono<AppEnv>()

app.get("/", async (c) => {
	const userId = c.get("userId")
	const list = await db
		.select()
		.from(schema.deployments)
		.where(eq(schema.deployments.userId, userId))
		.orderBy(schema.deployments.createdAt)

	return c.json({ ok: true, data: list })
})

// Quick deploy: create + upload + build + start in one request (for CLI)
app.post("/quick", async (c) => {
	const userId = c.get("userId")
	const formData = await c.req.formData()

	const name = formData.get("name")
	if (typeof name !== "string" || name.length === 0) {
		return c.json({ ok: false, error: "name is required" }, 400)
	}

	const fileEntry = formData.get("code")
	const file = fileEntry instanceof File ? fileEntry : null
	if (file === null) {
		return c.json({ ok: false, error: "code archive is required" }, 400)
	}

	const rawEntrypoint = formData.get("entrypoint")
	const entrypoint =
		typeof rawEntrypoint === "string" ? rawEntrypoint : "main.py"

	const id = nanoid()
	const archiveKey = `${userId}/${id}`

	await db.insert(schema.deployments).values({
		id,
		userId,
		name,
		archiveKey,
		entrypoint,
	})

	void logEvent(id, "created", `Quick deploy: "${name}"`)

	// Extract archive
	const uploadPath = path.join(UPLOAD_DIR, archiveKey)
	await mkdir(uploadPath, { recursive: true })
	const buffer = Buffer.from(await file.arrayBuffer())
	const { extract } = await import("tar")
	const { Readable } = await import("node:stream")
	const readable = Readable.from(buffer)
	await new Promise<void>((resolve, reject) => {
		readable
			.pipe(extract({ cwd: uploadPath }))
			.on("finish", resolve)
			.on("error", reject)
	})

	void logEvent(id, "upload", "Code uploaded")

	// Build + start
	await db
		.update(schema.deployments)
		.set({ status: "building", updatedAt: new Date() })
		.where(eq(schema.deployments.id, id))

	void logEvent(id, "build_start", "Building image")

	try {
		const imageTag = await buildDeploymentImage(id, uploadPath, entrypoint)
		const containerId = await createAndStartContainer({
			deploymentId: id,
			imageTag,
			envVars: {},
			cpuLimit: 1,
			memoryLimitMb: 256,
			restartPolicy: "on-failure",
		})

		await db
			.update(schema.deployments)
			.set({
				status: "running",
				containerId,
				imageTag,
				updatedAt: new Date(),
			})
			.where(eq(schema.deployments.id, id))

		void logEvent(id, "started", "Deployment started")

		return c.json({ ok: true, data: { id, status: "running" } }, 201)
	} catch (err) {
		const message = err instanceof Error ? err.message : "Build failed"
		void logEvent(id, "build_failed", message)

		await db
			.update(schema.deployments)
			.set({
				status: "failed",
				lastCrashReason: message,
				updatedAt: new Date(),
			})
			.where(eq(schema.deployments.id, id))

		return c.json({ ok: false, error: message }, 500)
	}
})

app.post("/", async (c) => {
	const userId = c.get("userId")
	const body = await c.req.json<CreateDeploymentRequest>()

	const id = nanoid()
	const archiveKey = `${userId}/${id}`

	await db.insert(schema.deployments).values({
		id,
		userId,
		name: body.name,
		archiveKey,
		entrypoint: body.entrypoint ?? "main.py",
		envVars: body.envVars ?? {},
		cpuLimit: body.cpuLimit ?? 1,
		memoryLimitMb: body.memoryLimitMb ?? 256,
		restartPolicy: body.restartPolicy ?? "on-failure",
	})

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(eq(schema.deployments.id, id))

	void logEvent(id, "created", `Deployment "${body.name}" created`)

	return c.json({ ok: true, data: deployment }, 201)
})

app.post("/:id/upload", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (!deployment) {
		return c.json({ ok: false, error: "Deployment not found" }, 404)
	}

	const formData = await c.req.formData()
	const fileEntry = formData.get("code")
	const file = fileEntry instanceof File ? fileEntry : null
	if (file === null) {
		return c.json({ ok: false, error: "No code file uploaded" }, 400)
	}

	const uploadPath = path.join(UPLOAD_DIR, deployment.archiveKey)
	await mkdir(uploadPath, { recursive: true })

	const buffer = Buffer.from(await file.arrayBuffer())
	const { extract } = await import("tar")
	const { Readable } = await import("node:stream")

	const readable = Readable.from(buffer)
	await new Promise<void>((resolve, reject) => {
		readable
			.pipe(extract({ cwd: uploadPath }))
			.on("finish", resolve)
			.on("error", reject)
	})

	void logEvent(deploymentId, "upload", "Code uploaded")

	return c.json({ ok: true, data: { uploaded: true } })
})

app.post("/:id/redeploy", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (!deployment) {
		return c.json({ ok: false, error: "Deployment not found" }, 404)
	}

	// Stop existing container if running
	if (deployment.containerId !== null) {
		try {
			await stopContainer(deployment.containerId)
			await removeContainer(deployment.containerId)
		} catch {
			// container may already be gone
		}
	}

	void logEvent(deploymentId, "build_start", "Rebuilding image")

	await db
		.update(schema.deployments)
		.set({ status: "building", updatedAt: new Date() })
		.where(eq(schema.deployments.id, deploymentId))

	const codePath = path.join(UPLOAD_DIR, deployment.archiveKey)

	try {
		const imageTag = await buildDeploymentImage(
			deploymentId,
			codePath,
			deployment.entrypoint,
		)

		const containerId = await createAndStartContainer({
			deploymentId,
			imageTag,
			envVars: getEnvVars(deployment),
			cpuLimit: deployment.cpuLimit,
			memoryLimitMb: deployment.memoryLimitMb,
			restartPolicy: getRestartPolicy(deployment),
		})

		await db
			.update(schema.deployments)
			.set({
				status: "running",
				containerId,
				imageTag,
				updatedAt: new Date(),
			})
			.where(eq(schema.deployments.id, deploymentId))

		void logEvent(deploymentId, "started", "Redeployed and started")

		return c.json({ ok: true, data: { status: "running", containerId } })
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown build error"
		void logEvent(deploymentId, "build_failed", message)

		await db
			.update(schema.deployments)
			.set({
				status: "failed",
				lastCrashReason: message,
				updatedAt: new Date(),
			})
			.where(eq(schema.deployments.id, deploymentId))

		return c.json({ ok: false, error: message }, 500)
	}
})

app.post("/:id/start", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (!deployment) {
		return c.json({ ok: false, error: "Deployment not found" }, 404)
	}

	if (deployment.status === "running") {
		return c.json({ ok: false, error: "Already running" }, 409)
	}

	await db
		.update(schema.deployments)
		.set({ status: "building", updatedAt: new Date() })
		.where(eq(schema.deployments.id, deploymentId))

	const codePath = path.join(UPLOAD_DIR, deployment.archiveKey)

	try {
		const imageTag = await buildDeploymentImage(
			deploymentId,
			codePath,
			deployment.entrypoint,
		)

		const containerId = await createAndStartContainer({
			deploymentId,
			imageTag,
			envVars: getEnvVars(deployment),
			cpuLimit: deployment.cpuLimit,
			memoryLimitMb: deployment.memoryLimitMb,
			restartPolicy: getRestartPolicy(deployment),
		})

		await db
			.update(schema.deployments)
			.set({
				status: "running",
				containerId,
				imageTag,
				updatedAt: new Date(),
			})
			.where(eq(schema.deployments.id, deploymentId))

		void logEvent(deploymentId, "started", "Deployment started")

		return c.json({ ok: true, data: { status: "running", containerId } })
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown build error"
		void logEvent(deploymentId, "build_failed", message)
		await db
			.update(schema.deployments)
			.set({
				status: "failed",
				lastCrashReason: message,
				updatedAt: new Date(),
			})
			.where(eq(schema.deployments.id, deploymentId))

		return c.json({ ok: false, error: message }, 500)
	}
})

app.post("/:id/stop", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (!deployment) {
		return c.json({ ok: false, error: "Deployment not found" }, 404)
	}

	if (deployment.containerId !== null) {
		await stopContainer(deployment.containerId)
		await removeContainer(deployment.containerId)
	}

	await db
		.update(schema.deployments)
		.set({
			status: "stopped",
			containerId: null,
			stoppedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(schema.deployments.id, deploymentId))

	void logEvent(deploymentId, "stopped", "Deployment stopped")

	return c.json({ ok: true, data: { status: "stopped" } })
})

app.post("/:id/restart", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (deployment === undefined || deployment.containerId === null) {
		return c.json({ ok: false, error: "Not running" }, 400)
	}

	await stopContainer(deployment.containerId)
	await removeContainer(deployment.containerId)

	if (deployment.imageTag === null) {
		return c.json({ ok: false, error: "No image built" }, 400)
	}

	const containerId = await createAndStartContainer({
		deploymentId,
		imageTag: deployment.imageTag,
		envVars: getEnvVars(deployment),
		cpuLimit: deployment.cpuLimit,
		memoryLimitMb: deployment.memoryLimitMb,
		restartPolicy: getRestartPolicy(deployment),
	})

	await db
		.update(schema.deployments)
		.set({
			containerId,
			restartCount: deployment.restartCount + 1,
			updatedAt: new Date(),
		})
		.where(eq(schema.deployments.id, deploymentId))

	return c.json({ ok: true, data: { status: "running", containerId } })
})

app.get("/:id/logs", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (deployment === undefined || deployment.containerId === null) {
		return c.json({ ok: false, error: "No container" }, 400)
	}

	const tail = Number(c.req.query("tail") ?? "200")
	const logs = await getContainerLogs(deployment.containerId, tail)
	return c.json({ ok: true, data: { logs } })
})

app.get("/:id/metrics", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (deployment === undefined || deployment.containerId === null) {
		return c.json({ ok: false, error: "No container" }, 400)
	}

	const metrics = await getContainerStats(deployment.containerId)
	return c.json({ ok: true, data: metrics })
})

app.delete("/:id", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (!deployment) {
		return c.json({ ok: false, error: "Deployment not found" }, 404)
	}

	if (deployment.containerId !== null) {
		try {
			await stopContainer(deployment.containerId)
			await removeContainer(deployment.containerId)
		} catch {
			// container may already be gone
		}
	}

	void logEvent(
		deploymentId,
		"deleted",
		`Deployment "${deployment.name}" deleted`,
	)

	await db
		.delete(schema.deployments)
		.where(eq(schema.deployments.id, deploymentId))

	return c.json({ ok: true, data: { deleted: true } })
})

app.put("/:id", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")
	const body = await c.req.json<UpdateDeploymentRequest>()

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (!deployment) {
		return c.json({ ok: false, error: "Deployment not found" }, 404)
	}

	const updates: Record<string, unknown> = { updatedAt: new Date() }
	if (body.name !== undefined) {
		updates.name = body.name
	}
	if (body.entrypoint !== undefined) {
		updates.entrypoint = body.entrypoint
	}
	if (body.envVars !== undefined) {
		updates.envVars = body.envVars
	}
	if (body.cpuLimit !== undefined) {
		updates.cpuLimit = body.cpuLimit
	}
	if (body.memoryLimitMb !== undefined) {
		updates.memoryLimitMb = body.memoryLimitMb
	}
	if (body.restartPolicy !== undefined) {
		updates.restartPolicy = body.restartPolicy
	}

	await db
		.update(schema.deployments)
		.set(updates)
		.where(eq(schema.deployments.id, deploymentId))

	void logEvent(deploymentId, "settings_updated", "Settings updated")

	return c.json({ ok: true, data: { updated: true } })
})

app.get("/:id/events", async (c) => {
	const userId = c.get("userId")
	const deploymentId = c.req.param("id")

	const [deployment] = await db
		.select()
		.from(schema.deployments)
		.where(
			and(
				eq(schema.deployments.id, deploymentId),
				eq(schema.deployments.userId, userId),
			),
		)

	if (!deployment) {
		return c.json({ ok: false, error: "Deployment not found" }, 404)
	}

	const events = await db
		.select()
		.from(schema.deploymentEvents)
		.where(eq(schema.deploymentEvents.deploymentId, deploymentId))
		.orderBy(schema.deploymentEvents.createdAt)
		.limit(100)

	return c.json({ ok: true, data: events })
})

export default app

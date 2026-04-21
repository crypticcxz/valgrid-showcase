import { eq } from "drizzle-orm"
import {
	createAndStartContainer,
	inspectContainer,
	removeContainer,
} from "./container.ts"
import { db, schema } from "./db/index.ts"
import { getEnvVars, getRestartPolicy } from "./deploymentHelpers.ts"

const CHECK_INTERVAL_MS = 30_000

export function startMonitor(): void {
	setInterval(() => {
		void checkDeployments()
	}, CHECK_INTERVAL_MS)
	console.log(
		`[monitor] health checker running every ${CHECK_INTERVAL_MS / 1000}s`,
	)
}

async function checkDeployments(): Promise<void> {
	const running = await db
		.select()
		.from(schema.deployments)
		.where(eq(schema.deployments.status, "running"))

	for (const deployment of running) {
		if (deployment.containerId === null) {
			continue
		}

		try {
			const info = await inspectContainer(deployment.containerId)

			if (!info.running) {
				console.log(
					`[monitor] deployment ${deployment.id} exited with code ${info.exitCode}`,
				)

				if (
					deployment.restartPolicy === "always" ||
					(deployment.restartPolicy === "on-failure" && info.exitCode !== 0)
				) {
					await handleRestart(deployment)
				} else {
					await db
						.update(schema.deployments)
						.set({
							status: "stopped",
							stoppedAt: new Date(),
							lastCrashReason: `Exit code: ${info.exitCode}`,
						})
						.where(eq(schema.deployments.id, deployment.id))
				}
			}
		} catch {
			console.error(
				`[monitor] failed to inspect container for deployment ${deployment.id}`,
			)
			await db
				.update(schema.deployments)
				.set({ status: "crashed", lastCrashReason: "Container not found" })
				.where(eq(schema.deployments.id, deployment.id))
		}
	}
}

async function handleRestart(
	deployment: typeof schema.deployments.$inferSelect,
): Promise<void> {
	console.log(`[monitor] restarting deployment ${deployment.id}`)

	if (deployment.containerId !== null) {
		try {
			await removeContainer(deployment.containerId)
		} catch {
			// container may already be gone
		}
	}

	if (deployment.imageTag === null) {
		return
	}

	try {
		const newContainerId = await createAndStartContainer({
			deploymentId: deployment.id,
			imageTag: deployment.imageTag,
			envVars: getEnvVars(deployment),
			cpuLimit: deployment.cpuLimit,
			memoryLimitMb: deployment.memoryLimitMb,
			restartPolicy: getRestartPolicy(deployment),
		})

		await db
			.update(schema.deployments)
			.set({
				containerId: newContainerId,
				restartCount: deployment.restartCount + 1,
				updatedAt: new Date(),
			})
			.where(eq(schema.deployments.id, deployment.id))
	} catch (err) {
		console.error(`[monitor] restart failed for ${deployment.id}`, err)
		await db
			.update(schema.deployments)
			.set({
				status: "crashed",
				lastCrashReason: "Restart failed",
			})
			.where(eq(schema.deployments.id, deployment.id))
	}
}

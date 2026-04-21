import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { getContainerLogs } from "./container.ts"
import { db, schema } from "./db/index.ts"

const COLLECT_INTERVAL_MS = 5_000
const lastTimestamps = new Map<string, string>()

export function startLogCollector(): void {
	setInterval(() => {
		void collectLogs()
	}, COLLECT_INTERVAL_MS)
	console.log(`[log-collector] running every ${COLLECT_INTERVAL_MS / 1000}s`)
}

async function collectLogs(): Promise<void> {
	const running = await db
		.select({
			id: schema.deployments.id,
			containerId: schema.deployments.containerId,
		})
		.from(schema.deployments)
		.where(eq(schema.deployments.status, "running"))

	for (const deployment of running) {
		if (deployment.containerId === null) {
			continue
		}

		try {
			const raw = await getContainerLogs(deployment.containerId, 50)
			const lines = raw.split("\n").filter((l) => l.trim().length > 0)

			const lastTs = lastTimestamps.get(deployment.id) ?? ""
			const newLines = lines.filter((line) => line > lastTs)

			if (newLines.length === 0) {
				continue
			}

			lastTimestamps.set(deployment.id, newLines.at(-1) ?? lastTs)

			const rows = newLines.map((line) => {
				const isStderr = line.includes("stderr")
				return {
					id: nanoid(),
					deploymentId: deployment.id,
					stream: isStderr ? "stderr" : "stdout",
					message: line,
				}
			})

			await db.insert(schema.deploymentLogs).values(rows)
		} catch {
			// container may have stopped between query and log fetch
		}
	}
}

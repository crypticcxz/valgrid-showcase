import { desc, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db, schema } from "./db/index.ts"

export async function logEvent(
	deploymentId: string,
	type: string,
	message?: string,
	metadata?: Record<string, unknown>,
): Promise<void> {
	await db.insert(schema.deploymentEvents).values({
		id: nanoid(),
		deploymentId,
		type,
		message: message ?? null,
		metadata: metadata ?? {},
	})
}

export async function getEvents(
	deploymentId: string,
	limit = 50,
): Promise<Array<typeof schema.deploymentEvents.$inferSelect>> {
	return db
		.select()
		.from(schema.deploymentEvents)
		.where(eq(schema.deploymentEvents.deploymentId, deploymentId))
		.orderBy(desc(schema.deploymentEvents.createdAt))
		.limit(limit)
}

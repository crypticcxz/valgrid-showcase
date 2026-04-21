import {
	type Collection,
	createCollection,
	type UtilsRecord,
} from "@tanstack/db"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import type { Deployment, DeploymentEvent, DeploymentLog } from "./types.ts"

type ElectricCollection<T extends { id: string }> = Collection<
	T,
	string | number,
	UtilsRecord,
	never,
	T
>

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
const ELECTRIC_URL: string =
	((globalThis as Record<string, unknown>).VITE_ELECTRIC_URL as
		| string
		| undefined) ?? "http://localhost:3001/api/electric/v1/shape"
/* eslint-enable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

const collectionCache = new Map<string, ElectricCollection<{ id: string }>>()

function makeFilteredCollection<T extends { id: string }>(
	table: string,
	where: string,
): ElectricCollection<T> {
	const cacheKey = `${table}::${where}`
	const cached = collectionCache.get(cacheKey)
	if (cached !== undefined) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		return cached as unknown as ElectricCollection<T>
	}
	const collection = createCollection<T>(
		electricCollectionOptions({
			id: cacheKey,
			shapeOptions: {
				url: ELECTRIC_URL,
				params: { table: table, where: where },
			},
			getKey: (row: T) => row.id,
		}),
	)
	collectionCache.set(
		cacheKey,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		collection as unknown as ElectricCollection<{ id: string }>,
	)
	return collection
}

export function deploymentsCollection(userId: string) {
	return makeFilteredCollection<Deployment>(
		"deployments",
		`"userId" = '${userId}'`,
	)
}

export function deploymentEventsCollection(deploymentId: string) {
	return makeFilteredCollection<DeploymentEvent>(
		"deployment_events",
		`"deploymentId" = '${deploymentId}'`,
	)
}

export function deploymentLogsCollection(deploymentId: string) {
	return makeFilteredCollection<DeploymentLog>(
		"deployment_logs",
		`"deploymentId" = '${deploymentId}'`,
	)
}

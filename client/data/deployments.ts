import { createEffect, createSignal } from "solid-js"
import { routes } from "../../shared/api.ts"
import {
	deploymentEventsCollection,
	deploymentLogsCollection,
	deploymentsCollection,
} from "../../shared/electric.ts"
import { parseJsonResponse } from "../../shared/json.ts"
import { useLive } from "../../shared/liveData.ts"
import type {
	Deployment,
	DeploymentEvent,
	DeploymentLog,
} from "../../shared/types.ts"
import { authHeaders } from "./auth.ts"

const [deploymentList, setDeploymentList] = createSignal<Array<Deployment>>([])

export { deploymentList as deployments }

export function setupDeploymentSync(userId: string): void {
	const live = useLive<Deployment>(() => deploymentsCollection(userId))

	createEffect(() => {
		setDeploymentList(
			[...live()].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			),
		)
	})
}

export function useDeploymentEvents(
	deploymentId: string,
): () => Array<DeploymentEvent> {
	const [events, setEvents] = createSignal<Array<DeploymentEvent>>([])
	const live = useLive<DeploymentEvent>(() =>
		deploymentEventsCollection(deploymentId),
	)

	createEffect(() => {
		setEvents(
			[...live()].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			),
		)
	})

	return events
}

export function useDeploymentLogs(
	deploymentId: string,
): () => Array<DeploymentLog> {
	const [logs, setLogs] = createSignal<Array<DeploymentLog>>([])
	const live = useLive<DeploymentLog>(() =>
		deploymentLogsCollection(deploymentId),
	)

	createEffect(() => {
		setLogs(
			[...live()].sort(
				(a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			),
		)
	})

	return logs
}

async function apiPost<T>(url: string, body?: unknown): Promise<T> {
	const headers: Record<string, string> = { ...authHeaders() }
	const init: RequestInit = { method: "POST", headers }
	if (body !== undefined) {
		headers["Content-Type"] = "application/json"
		init.body = JSON.stringify(body)
	}
	const res = await fetch(url, init)
	return parseJsonResponse<T>(res)
}

async function apiDelete<T>(url: string): Promise<T> {
	const res = await fetch(url, { method: "DELETE", headers: authHeaders() })
	return parseJsonResponse<T>(res)
}

export async function createDeployment(body: {
	name: string
	entrypoint?: string
	envVars?: Record<string, string>
}): Promise<{ id: string }> {
	const result = await apiPost<{ ok: boolean; data: { id: string } }>(
		routes.deployments.create,
		body,
	)
	return result.data
}

export async function uploadCode(id: string, file: File): Promise<void> {
	const form = new FormData()
	form.append("code", file)
	await fetch(routes.deployments.upload(id), {
		method: "POST",
		headers: authHeaders(),
		body: form,
	})
}

export async function updateDeployment(
	id: string,
	body: {
		name?: string
		entrypoint?: string
		envVars?: Record<string, string>
		cpuLimit?: number
		memoryLimitMb?: number
		restartPolicy?: string
	},
): Promise<void> {
	await apiPost(routes.deployments.update(id), body)
}

export async function startDeployment(id: string): Promise<void> {
	await apiPost(routes.deployments.start(id))
}

export async function stopDeployment(id: string): Promise<void> {
	await apiPost(routes.deployments.stop(id))
}

export async function restartDeployment(id: string): Promise<void> {
	await apiPost(routes.deployments.restart(id))
}

export async function redeployDeployment(
	id: string,
	file: File,
): Promise<void> {
	const form = new FormData()
	form.append("code", file)
	await fetch(routes.deployments.upload(id), {
		method: "POST",
		headers: authHeaders(),
		body: form,
	})
	await apiPost(routes.deployments.redeploy(id))
}

export async function deleteDeployment(id: string): Promise<void> {
	await apiDelete(routes.deployments.delete(id))
}

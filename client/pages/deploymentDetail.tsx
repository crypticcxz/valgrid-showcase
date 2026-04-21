import { useNavigate, useParams } from "@solidjs/router"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { Deployment } from "../../shared/types.ts"
import { EventTimeline } from "../components/deployment/eventTimeline.tsx"
import { LogViewer } from "../components/deployment/logViewer.tsx"
import { MetricsPanel } from "../components/deployment/metricsPanel.tsx"
import { RedeployPanel } from "../components/deployment/redeployPanel.tsx"
import { SettingsEditor } from "../components/deployment/settingsEditor.tsx"
import {
	deleteDeployment,
	deployments,
	restartDeployment,
	startDeployment,
	stopDeployment,
	useDeploymentEvents,
	useDeploymentLogs,
} from "../data/deployments.ts"

export function DeploymentDetail() {
	const params = useParams()
	const navigate = useNavigate()
	const [actionLoading, setActionLoading] = createSignal("")
	const [tab, setTab] = createSignal<"logs" | "events" | "settings">("logs")

	const deployment = createMemo((): Deployment | undefined =>
		deployments().find((d) => d.id === params.id),
	)

	const events = useDeploymentEvents(params.id ?? "")
	const logs = useDeploymentLogs(params.id ?? "")

	async function handleAction(action: "start" | "stop" | "restart" | "delete") {
		const id = params.id
		if (id === undefined || id === "") {
			return
		}

		setActionLoading(action)
		try {
			switch (action) {
				case "start": {
					await startDeployment(id)
					break
				}
				case "stop": {
					await stopDeployment(id)
					break
				}
				case "restart": {
					await restartDeployment(id)
					break
				}
				case "delete": {
					await deleteDeployment(id)
					navigate("/")
					return
				}
			}
		} finally {
			setActionLoading("")
		}
	}

	return (
		<Show
			when={deployment()}
			fallback={<p class="text-zinc-500">Loading...</p>}
		>
			{(d) => (
				<div class="flex flex-col gap-6">
					<div class="flex items-center justify-between">
						<div>
							<h1 class="text-2xl font-bold">{d().name}</h1>
							<p class="text-sm text-zinc-400">
								{d().status} &middot; {d().entrypoint} &middot;{" "}
								{d().restartCount} restarts
							</p>
						</div>
						<div class="flex gap-2">
							<Show when={d().status !== "running"}>
								<button
									type="button"
									onClick={() => {
										void handleAction("start")
									}}
									disabled={actionLoading().length > 0}
									class="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
								>
									{actionLoading() === "start" ? "Starting..." : "Start"}
								</button>
							</Show>
							<Show when={d().status === "running"}>
								<button
									type="button"
									onClick={() => {
										void handleAction("stop")
									}}
									disabled={actionLoading().length > 0}
									class="rounded bg-zinc-700 px-3 py-1.5 text-sm font-medium hover:bg-zinc-600 disabled:opacity-50"
								>
									{actionLoading() === "stop" ? "Stopping..." : "Stop"}
								</button>
								<button
									type="button"
									onClick={() => {
										void handleAction("restart")
									}}
									disabled={actionLoading().length > 0}
									class="rounded bg-yellow-600 px-3 py-1.5 text-sm font-medium hover:bg-yellow-500 disabled:opacity-50"
								>
									{actionLoading() === "restart" ? "Restarting..." : "Restart"}
								</button>
							</Show>
							<button
								type="button"
								onClick={() => {
									void handleAction("delete")
								}}
								disabled={actionLoading().length > 0}
								class="rounded bg-red-700 px-3 py-1.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50"
							>
								Delete
							</button>
						</div>
					</div>

					<div class="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm sm:grid-cols-2">
						<div>
							<span class="text-zinc-500">CPU Limit:</span>{" "}
							<span class="text-zinc-200">{d().cpuLimit} cores</span>
						</div>
						<div>
							<span class="text-zinc-500">Memory:</span>{" "}
							<span class="text-zinc-200">{d().memoryLimitMb} MB</span>
						</div>
						<div>
							<span class="text-zinc-500">Restart Policy:</span>{" "}
							<span class="text-zinc-200">{d().restartPolicy}</span>
						</div>
						<div>
							<span class="text-zinc-500">Created:</span>{" "}
							<span class="text-zinc-200">
								{new Date(d().createdAt).toLocaleString()}
							</span>
						</div>
					</div>

					<Show when={d().lastCrashReason !== null}>
						<div class="rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-300">
							Last crash: {d().lastCrashReason}
						</div>
					</Show>

					<Show when={d().status === "running"}>
						<MetricsPanel deploymentId={d().id} />
					</Show>

					{/* Tab bar */}
					<div class="flex gap-1 border-b border-zinc-800">
						<For each={["logs", "events", "settings"] as const}>
							{(t) => (
								<button
									type="button"
									onClick={() => setTab(t)}
									class={`px-4 py-2 text-sm font-medium ${
										tab() === t
											? "border-b-2 border-emerald-400 text-emerald-400"
											: "text-zinc-500 hover:text-zinc-300"
									}`}
								>
									{t.charAt(0).toUpperCase() + t.slice(1)}
								</button>
							)}
						</For>
					</div>

					<Show when={tab() === "logs"}>
						<LogViewer logs={logs()} />
					</Show>

					<Show when={tab() === "events"}>
						<EventTimeline events={events()} />
					</Show>

					<Show when={tab() === "settings"}>
						<div class="flex flex-col gap-4">
							<SettingsEditor deployment={d()} />
							<RedeployPanel deploymentId={d().id} />
						</div>
					</Show>
				</div>
			)}
		</Show>
	)
}

import { createSignal, onCleanup, onMount } from "solid-js"
import { routes } from "../../../shared/api.ts"
import { parseJsonResponse } from "../../../shared/json.ts"
import { authHeaders } from "../../data/auth.ts"

type Metrics = {
	cpuPercent: number
	memoryUsageMb: number
	memoryLimitMb: number
	networkRxBytes: number
	networkTxBytes: number
}

export function MetricsPanel(props: { deploymentId: string }) {
	const [metrics, setMetrics] = createSignal<Metrics | null>(null)

	let interval: ReturnType<typeof setInterval>

	async function fetchMetrics(): Promise<void> {
		try {
			const res = await fetch(routes.deployments.metrics(props.deploymentId), {
				headers: authHeaders(),
			})
			const data = await parseJsonResponse<{ ok: boolean; data: Metrics }>(res)
			setMetrics(data.data)
		} catch {
			// metrics not available
		}
	}

	onMount(() => {
		void fetchMetrics()
		interval = setInterval(() => {
			void fetchMetrics()
		}, 5000)
	})

	onCleanup(() => {
		clearInterval(interval)
	})

	function formatBytes(bytes: number): string {
		if (bytes < 1024) {
			return `${bytes} B`
		}
		if (bytes < 1024 * 1024) {
			return `${(bytes / 1024).toFixed(1)} KB`
		}
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`
	}

	return (
		<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
			<h4 class="mb-3 text-sm font-medium text-zinc-400">Metrics</h4>
			{metrics() !== null ? (
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p class="text-zinc-500">CPU</p>
						<p class="text-lg font-medium text-zinc-100">
							{metrics()?.cpuPercent}%
						</p>
					</div>
					<div>
						<p class="text-zinc-500">Memory</p>
						<p class="text-lg font-medium text-zinc-100">
							{metrics()?.memoryUsageMb} / {metrics()?.memoryLimitMb} MB
						</p>
					</div>
					<div>
						<p class="text-zinc-500">Network RX</p>
						<p class="text-lg font-medium text-zinc-100">
							{formatBytes(metrics()?.networkRxBytes ?? 0)}
						</p>
					</div>
					<div>
						<p class="text-zinc-500">Network TX</p>
						<p class="text-lg font-medium text-zinc-100">
							{formatBytes(metrics()?.networkTxBytes ?? 0)}
						</p>
					</div>
				</div>
			) : (
				<p class="text-sm text-zinc-500">No metrics available</p>
			)}
		</div>
	)
}

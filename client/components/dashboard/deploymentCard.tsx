import { A } from "@solidjs/router"
import type { Deployment } from "../../../shared/types.ts"

const STATUS_COLORS: Record<string, string> = {
	running: "bg-emerald-500",
	stopped: "bg-zinc-500",
	failed: "bg-red-500",
	crashed: "bg-red-500",
	building: "bg-yellow-500",
	pending: "bg-zinc-600",
}

export function DeploymentCard(props: { deployment: Deployment }) {
	return (
		<A
			href={`/deploy/${props.deployment.id}`}
			class="block rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700"
		>
			<div class="flex items-center justify-between">
				<h3 class="font-medium text-zinc-100">{props.deployment.name}</h3>
				<div class="flex items-center gap-2">
					<span
						class={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[props.deployment.status] ?? "bg-zinc-600"}`}
					/>
					<span class="text-sm text-zinc-400">{props.deployment.status}</span>
				</div>
			</div>
			<div class="mt-2 flex gap-4 text-xs text-zinc-500">
				<span>{props.deployment.entrypoint}</span>
				<span>{props.deployment.memoryLimitMb}MB</span>
				<span>{props.deployment.cpuLimit} CPU</span>
			</div>
		</A>
	)
}

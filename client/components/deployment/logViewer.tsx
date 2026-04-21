import { For, Show } from "solid-js"
import type { DeploymentLog } from "../../../shared/types.ts"

export function LogViewer(props: { logs: Array<DeploymentLog> }) {
	return (
		<div class="rounded-lg border border-zinc-800 bg-black p-4">
			<div class="mb-2 flex items-center justify-between">
				<h4 class="text-sm font-medium text-zinc-400">
					Logs ({props.logs.length})
				</h4>
				<span class="text-xs text-zinc-600">live via Electric SQL</span>
			</div>
			<Show
				when={props.logs.length > 0}
				fallback={<p class="text-sm text-zinc-500">No logs yet.</p>}
			>
				<div class="max-h-96 overflow-auto">
					<For each={props.logs}>
						{(log) => (
							<div class="flex gap-2 font-mono text-xs leading-5">
								<span class="shrink-0 text-zinc-600">
									{new Date(log.createdAt).toLocaleTimeString()}
								</span>
								<span
									class={
										log.stream === "stderr"
											? "text-red-400"
											: "text-emerald-300"
									}
								>
									{log.message}
								</span>
							</div>
						)}
					</For>
				</div>
			</Show>
		</div>
	)
}

import { For, Show } from "solid-js"
import type { DeploymentEvent } from "../../../shared/types.ts"

const EVENT_COLORS: Record<string, string> = {
	created: "bg-blue-500",
	started: "bg-emerald-500",
	stopped: "bg-zinc-500",
	crashed: "bg-red-500",
	build_failed: "bg-red-500",
	restarted: "bg-yellow-500",
	deleted: "bg-red-700",
	settings_updated: "bg-violet-500",
	upload: "bg-blue-400",
	build_start: "bg-yellow-400",
	build_success: "bg-emerald-400",
}

export function EventTimeline(props: { events: Array<DeploymentEvent> }) {
	return (
		<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
			<h4 class="mb-3 text-sm font-medium text-zinc-400">
				Event History ({props.events.length})
			</h4>
			<Show
				when={props.events.length > 0}
				fallback={<p class="text-sm text-zinc-500">No events yet.</p>}
			>
				<div class="flex flex-col gap-3">
					<For each={props.events}>
						{(event) => (
							<div class="flex items-start gap-3">
								<div class="mt-1.5 flex shrink-0 flex-col items-center">
									<span
										class={`inline-block h-2.5 w-2.5 rounded-full ${
											EVENT_COLORS[event.type] ?? "bg-zinc-600"
										}`}
									/>
								</div>
								<div class="min-w-0">
									<div class="flex items-baseline gap-2">
										<span class="text-sm font-medium text-zinc-200">
											{event.type}
										</span>
										<span class="text-xs text-zinc-600">
											{new Date(event.createdAt).toLocaleString()}
										</span>
									</div>
									<Show when={event.message !== null}>
										<p class="mt-0.5 text-xs text-zinc-400">{event.message}</p>
									</Show>
								</div>
							</div>
						)}
					</For>
				</div>
			</Show>
		</div>
	)
}

import { A, useNavigate } from "@solidjs/router"
import { For, onMount, Show } from "solid-js"
import { DeploymentCard } from "../components/dashboard/deploymentCard.tsx"
import { isLoggedIn, userId } from "../data/auth.ts"
import { deployments, setupDeploymentSync } from "../data/deployments.ts"

export function Dashboard() {
	const navigate = useNavigate()

	onMount(() => {
		if (!isLoggedIn()) {
			navigate("/login")
			return
		}
		setupDeploymentSync(userId())
	})

	const running = () => deployments().filter((d) => d.status === "running")
	const stopped = () => deployments().filter((d) => d.status !== "running")

	return (
		<div>
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold">Deployments</h1>
					<p class="text-sm text-zinc-500">
						{running().length} running / {deployments().length} total
					</p>
				</div>
				<A
					href="/deploy/new"
					class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
				>
					New Deployment
				</A>
			</div>

			<Show when={deployments().length === 0}>
				<div class="rounded-lg border border-dashed border-zinc-700 p-12 text-center">
					<p class="text-zinc-400">No deployments yet.</p>
					<A
						href="/deploy/new"
						class="mt-2 inline-block text-sm text-emerald-400 hover:underline"
					>
						Create your first deployment
					</A>
				</div>
			</Show>

			<Show when={running().length > 0}>
				<h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
					Running
				</h2>
				<div class="mb-6 grid gap-3">
					<For each={running()}>{(d) => <DeploymentCard deployment={d} />}</For>
				</div>
			</Show>

			<Show when={stopped().length > 0}>
				<h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
					Stopped
				</h2>
				<div class="grid gap-3">
					<For each={stopped()}>{(d) => <DeploymentCard deployment={d} />}</For>
				</div>
			</Show>
		</div>
	)
}

import { createSignal, Show } from "solid-js"
import { redeployDeployment } from "../../data/deployments.ts"

export function RedeployPanel(props: { deploymentId: string }) {
	const [file, setFile] = createSignal<File | null>(null)
	const [deploying, setDeploying] = createSignal(false)
	const [error, setError] = createSignal("")

	async function handleRedeploy(): Promise<void> {
		const selectedFile = file()
		if (selectedFile === null) {
			setError("Select a .tar.gz archive first")
			return
		}

		setDeploying(true)
		setError("")
		try {
			await redeployDeployment(props.deploymentId, selectedFile)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Redeploy failed")
		} finally {
			setDeploying(false)
		}
	}

	return (
		<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
			<h4 class="mb-3 text-sm font-medium text-zinc-400">Redeploy</h4>
			<p class="mb-3 text-xs text-zinc-500">
				Upload new code, rebuild the image, and restart the container.
			</p>

			<Show when={error().length > 0}>
				<p class="mb-3 text-sm text-red-400">{error()}</p>
			</Show>

			<div class="flex items-center gap-3">
				<input
					type="file"
					accept=".tar.gz,.tgz"
					onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
					class="text-sm text-zinc-400 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:text-zinc-300"
				/>
				<button
					type="button"
					onClick={() => {
						void handleRedeploy()
					}}
					disabled={deploying() || file() === null}
					class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
				>
					{deploying() ? "Deploying..." : "Redeploy"}
				</button>
			</div>
		</div>
	)
}

import { createSignal, Show } from "solid-js"
import type { Deployment, RestartPolicy } from "../../../shared/types.ts"
import { updateDeployment } from "../../data/deployments.ts"

function isRestartPolicy(s: string): s is RestartPolicy {
	return s === "always" || s === "on-failure" || s === "never"
}

export function SettingsEditor(props: { deployment: Deployment }) {
	const [name, setName] = createSignal(props.deployment.name)
	const [entrypoint, setEntrypoint] = createSignal(props.deployment.entrypoint)
	const [cpuLimit, setCpuLimit] = createSignal(
		String(props.deployment.cpuLimit),
	)
	const [memoryLimitMb, setMemoryLimitMb] = createSignal(
		String(props.deployment.memoryLimitMb),
	)
	const [restartPolicy, setRestartPolicy] = createSignal(
		props.deployment.restartPolicy,
	)
	const [envText, setEnvText] = createSignal(
		Object.entries(props.deployment.envVars)
			.map(([k, v]) => `${k}=${v}`)
			.join("\n"),
	)
	const [saving, setSaving] = createSignal(false)
	const [saved, setSaved] = createSignal(false)
	const [error, setError] = createSignal("")

	function parseEnvVars(text: string): Record<string, string> {
		const vars: Record<string, string> = {}
		for (const line of text.split("\n")) {
			const trimmed = line.trim()
			if (trimmed.length === 0 || trimmed.startsWith("#")) {
				continue
			}
			const eqIdx = trimmed.indexOf("=")
			if (eqIdx > 0) {
				vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
			}
		}
		return vars
	}

	async function handleSave(): Promise<void> {
		setSaving(true)
		setError("")
		setSaved(false)
		try {
			await updateDeployment(props.deployment.id, {
				name: name(),
				entrypoint: entrypoint(),
				cpuLimit: Number(cpuLimit()),
				memoryLimitMb: Number(memoryLimitMb()),
				restartPolicy: restartPolicy(),
				envVars: parseEnvVars(envText()),
			})
			setSaved(true)
			setTimeout(() => setSaved(false), 3000)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
			<h4 class="mb-4 text-sm font-medium text-zinc-400">
				Deployment Settings
			</h4>

			<Show when={error().length > 0}>
				<p class="mb-4 text-sm text-red-400">{error()}</p>
			</Show>

			<div class="flex flex-col gap-4">
				<label class="block">
					<span class="mb-1 block text-sm text-zinc-400">Name</span>
					<input
						type="text"
						value={name()}
						onInput={(e) => setName(e.currentTarget.value)}
						class="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
					/>
				</label>

				<label class="block">
					<span class="mb-1 block text-sm text-zinc-400">Entrypoint</span>
					<input
						type="text"
						value={entrypoint()}
						onInput={(e) => setEntrypoint(e.currentTarget.value)}
						class="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
					/>
				</label>

				<div class="grid grid-cols-2 gap-4">
					<label class="block">
						<span class="mb-1 block text-sm text-zinc-400">CPU Limit</span>
						<input
							type="number"
							step="0.5"
							min="0.5"
							max="8"
							value={cpuLimit()}
							onInput={(e) => setCpuLimit(e.currentTarget.value)}
							class="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
						/>
					</label>

					<label class="block">
						<span class="mb-1 block text-sm text-zinc-400">Memory (MB)</span>
						<input
							type="number"
							step="128"
							min="128"
							max="8192"
							value={memoryLimitMb()}
							onInput={(e) => setMemoryLimitMb(e.currentTarget.value)}
							class="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
						/>
					</label>
				</div>

				<label class="block">
					<span class="mb-1 block text-sm text-zinc-400">Restart Policy</span>
					<select
						value={restartPolicy()}
						onChange={(e) => {
							const val = e.currentTarget.value
							if (isRestartPolicy(val)) {
								setRestartPolicy(val)
							}
						}}
						class="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
					>
						<option value="always">Always</option>
						<option value="on-failure">On Failure</option>
						<option value="never">Never</option>
					</select>
				</label>

				<label class="block">
					<span class="mb-1 block text-sm text-zinc-400">
						Environment Variables (KEY=VALUE, one per line)
					</span>
					<textarea
						value={envText()}
						onInput={(e) => setEnvText(e.currentTarget.value)}
						rows={6}
						class="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
					/>
				</label>

				<div class="flex items-center gap-3">
					<button
						type="button"
						onClick={() => {
							void handleSave()
						}}
						disabled={saving()}
						class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
					>
						{saving() ? "Saving..." : "Save Settings"}
					</button>
					<Show when={saved()}>
						<span class="text-sm text-emerald-400">Saved</span>
					</Show>
				</div>

				<p class="text-xs text-zinc-600">
					Changes take effect on next restart. Running deployments keep their
					current config until restarted.
				</p>
			</div>
		</div>
	)
}

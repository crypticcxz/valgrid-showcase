import { useNavigate } from "@solidjs/router"
import { createSignal } from "solid-js"
import { createDeployment, uploadCode } from "../data/deployments.ts"

export function NewDeployment() {
	const navigate = useNavigate()
	const [name, setName] = createSignal("")
	const [entrypoint, setEntrypoint] = createSignal("main.py")
	const [envText, setEnvText] = createSignal("")
	const [file, setFile] = createSignal<File | null>(null)
	const [error, setError] = createSignal("")
	const [uploading, setUploading] = createSignal(false)

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

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		setError("")

		if (!file()) {
			setError("Please upload a .tar.gz of your project")
			return
		}

		setUploading(true)
		try {
			const deployment = await createDeployment({
				name: name(),
				entrypoint: entrypoint(),
				envVars: parseEnvVars(envText()),
			})

			const selectedFile = file()
			if (selectedFile === null) {
				setError("Please upload a .tar.gz of your project")
				return
			}
			await uploadCode(deployment.id, selectedFile)
			navigate(`/deploy/${deployment.id}`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Deploy failed")
		} finally {
			setUploading(false)
		}
	}

	return (
		<div class="mx-auto max-w-lg">
			<h1 class="mb-6 text-2xl font-bold">New Deployment</h1>
			{error() && <p class="mb-4 text-sm text-red-400">{error()}</p>}

			<form
				onSubmit={(e) => {
					void handleSubmit(e)
				}}
				class="flex flex-col gap-4"
			>
				<label class="block">
					<span class="mb-1 block text-sm text-zinc-400">Name</span>
					<input
						type="text"
						value={name()}
						onInput={(e) => setName(e.currentTarget.value)}
						placeholder="my-solana-bot"
						class="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
						required={true}
					/>
				</label>

				<label class="block">
					<span class="mb-1 block text-sm text-zinc-400">Entrypoint</span>
					<input
						type="text"
						value={entrypoint()}
						onInput={(e) => setEntrypoint(e.currentTarget.value)}
						class="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
					/>
				</label>

				<label class="block">
					<span class="mb-1 block text-sm text-zinc-400">
						Code Archive (.tar.gz)
					</span>
					<input
						type="file"
						accept=".tar.gz,.tgz"
						onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
						class="w-full text-sm text-zinc-400 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:text-zinc-300"
					/>
				</label>

				<label class="block">
					<span class="mb-1 block text-sm text-zinc-400">
						Environment Variables (KEY=VALUE, one per line)
					</span>
					<textarea
						value={envText()}
						onInput={(e) => setEnvText(e.currentTarget.value)}
						placeholder={
							"SOLANA_RPC_URL=https://api.mainnet-beta.solana.com\nPRIVATE_KEY=..."
						}
						rows={4}
						class="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
					/>
				</label>

				<button
					type="submit"
					disabled={uploading()}
					class="w-full rounded bg-emerald-600 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
				>
					{uploading() ? "Deploying..." : "Create Deployment"}
				</button>
			</form>
		</div>
	)
}

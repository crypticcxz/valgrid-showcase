import { useNavigate } from "@solidjs/router"
import { createSignal } from "solid-js"
import { register } from "../data/auth.ts"

export function Register() {
	const navigate = useNavigate()
	const [email, setEmail] = createSignal("")
	const [password, setPassword] = createSignal("")
	const [displayName, setDisplayName] = createSignal("")
	const [error, setError] = createSignal("")

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		setError("")
		try {
			await register(email(), password(), displayName())
			navigate("/")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed")
		}
	}

	return (
		<div class="mx-auto max-w-sm pt-20">
			<h1 class="mb-6 text-2xl font-bold">Sign Up</h1>
			{error() && <p class="mb-4 text-sm text-red-400">{error()}</p>}
			<form
				onSubmit={(e) => {
					void handleSubmit(e)
				}}
				class="flex flex-col gap-4"
			>
				<input
					type="text"
					placeholder="Display Name"
					value={displayName()}
					onInput={(e) => setDisplayName(e.currentTarget.value)}
					class="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
					required={true}
				/>
				<input
					type="email"
					placeholder="Email"
					value={email()}
					onInput={(e) => setEmail(e.currentTarget.value)}
					class="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
					required={true}
				/>
				<input
					type="password"
					placeholder="Password"
					value={password()}
					onInput={(e) => setPassword(e.currentTarget.value)}
					class="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
					required={true}
				/>
				<button
					type="submit"
					class="w-full rounded bg-emerald-600 py-2 text-sm font-medium hover:bg-emerald-500"
				>
					Create Account
				</button>
			</form>
		</div>
	)
}

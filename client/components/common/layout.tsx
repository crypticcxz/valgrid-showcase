import { A, useNavigate } from "@solidjs/router"
import type { ParentProps } from "solid-js"
import { Show } from "solid-js"
import { isLoggedIn, logout } from "../../data/auth.ts"

export function Layout(props: ParentProps) {
	const navigate = useNavigate()

	function handleLogout() {
		logout()
		navigate("/login")
	}

	return (
		<div class="min-h-screen bg-zinc-950 text-zinc-100">
			<nav class="border-b border-zinc-800 px-6 py-4">
				<div class="mx-auto flex max-w-6xl items-center justify-between">
					<A href="/" class="text-xl font-bold tracking-tight text-emerald-400">
						valgrid
					</A>
					<div class="flex items-center gap-4">
						<Show
							when={isLoggedIn()}
							fallback={
								<>
									<A
										href="/login"
										class="text-sm text-zinc-400 hover:text-zinc-200"
									>
										Login
									</A>
									<A
										href="/register"
										class="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
									>
										Sign Up
									</A>
								</>
							}
						>
							<A
								href="/deploy/new"
								class="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
							>
								New Deploy
							</A>
							<button
								type="button"
								onClick={handleLogout}
								class="text-sm text-zinc-400 hover:text-zinc-200"
							>
								Logout
							</button>
						</Show>
					</div>
				</div>
			</nav>
			<main class="mx-auto max-w-6xl px-6 py-8">{props.children}</main>
		</div>
	)
}

import { createSignal } from "solid-js"
import { routes } from "../../shared/api.ts"
import { parseJsonResponse } from "../../shared/json.ts"

const [token, setToken] = createSignal(
	localStorage.getItem("valgrid_token") ?? "",
)
const [userId, setUserId] = createSignal(
	localStorage.getItem("valgrid_userId") ?? "",
)

export { token, userId }

export function isLoggedIn(): boolean {
	return token().length > 0
}

export async function login(email: string, password: string): Promise<void> {
	const res = await fetch(routes.auth.login, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	})
	const data = await parseJsonResponse<{
		ok: boolean
		data?: { token: string; userId: string }
		error?: string
	}>(res)
	if (!data.ok) {
		throw new Error(data.error ?? "Login failed")
	}
	setToken(data.data?.token ?? "")
	setUserId(data.data?.userId ?? "")
	localStorage.setItem("valgrid_token", data.data?.token ?? "")
	localStorage.setItem("valgrid_userId", data.data?.userId ?? "")
}

export async function register(
	email: string,
	password: string,
	displayName: string,
): Promise<void> {
	const res = await fetch(routes.auth.register, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password, displayName }),
	})
	const data = await parseJsonResponse<{
		ok: boolean
		data?: { token: string; userId: string }
		error?: string
	}>(res)
	if (!data.ok) {
		throw new Error(data.error ?? "Registration failed")
	}
	setToken(data.data?.token ?? "")
	setUserId(data.data?.userId ?? "")
	localStorage.setItem("valgrid_token", data.data?.token ?? "")
	localStorage.setItem("valgrid_userId", data.data?.userId ?? "")
}

export function logout(): void {
	setToken("")
	setUserId("")
	localStorage.removeItem("valgrid_token")
	localStorage.removeItem("valgrid_userId")
}

export function authHeaders(): Record<string, string> {
	return { Authorization: `Bearer ${token()}` }
}

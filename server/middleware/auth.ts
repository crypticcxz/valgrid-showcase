import type { Context, Next } from "hono"
import { verifyToken } from "../services/auth.ts"
import type { AppEnv } from "../types.ts"

export async function authMiddleware(
	c: Context<AppEnv>,
	next: Next,
): Promise<Response | undefined> {
	const header = c.req.header("Authorization")
	if (header === undefined || !header.startsWith("Bearer ")) {
		return c.json({ ok: false, error: "Unauthorized" }, 401)
	}

	const token = header.slice(7)
	const payload = verifyToken(token)
	if (!payload) {
		return c.json({ ok: false, error: "Invalid or expired token" }, 401)
	}

	c.set("userId", payload.userId)
	await next()
	return undefined
}

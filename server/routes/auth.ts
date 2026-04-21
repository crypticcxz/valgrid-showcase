import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { nanoid } from "nanoid"
import { createToken, hashPassword, verifyPassword } from "../services/auth.ts"
import { db, schema } from "../services/db/index.ts"
import type { AppEnv } from "../types.ts"

const app = new Hono<AppEnv>()

app.post("/register", async (c) => {
	const body = await c.req.json<{
		email: string
		password: string
		displayName: string
	}>()

	const existing = await db
		.select()
		.from(schema.users)
		.where(eq(schema.users.email, body.email))
		.limit(1)

	if (existing.length > 0) {
		return c.json({ ok: false, error: "Email already registered" }, 409)
	}

	const id = nanoid()
	await db.insert(schema.users).values({
		id,
		email: body.email,
		passwordHash: hashPassword(body.password),
		displayName: body.displayName,
	})

	const token = createToken({ userId: id })
	return c.json({ ok: true, data: { token, userId: id } })
})

app.post("/login", async (c) => {
	const body = await c.req.json<{ email: string; password: string }>()

	const [user] = await db
		.select()
		.from(schema.users)
		.where(eq(schema.users.email, body.email))
		.limit(1)

	if (!user || !verifyPassword(body.password, user.passwordHash)) {
		return c.json({ ok: false, error: "Invalid credentials" }, 401)
	}

	const token = createToken({ userId: user.id })
	return c.json({ ok: true, data: { token, userId: user.id } })
})

app.get("/me", async (c) => {
	const userId = c.get("userId")
	const [user] = await db
		.select({
			id: schema.users.id,
			email: schema.users.email,
			displayName: schema.users.displayName,
			tier: schema.users.tier,
			maxDeployments: schema.users.maxDeployments,
			createdAt: schema.users.createdAt,
		})
		.from(schema.users)
		.where(eq(schema.users.id, userId))
		.limit(1)

	if (!user) {
		return c.json({ ok: false, error: "User not found" }, 404)
	}

	return c.json({ ok: true, data: user })
})

export default app

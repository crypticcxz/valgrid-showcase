import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { parseJson } from "../../shared/json.ts"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me"

export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString("hex")
	const hash = createHash("sha256")
		.update(salt + password)
		.digest("hex")
	return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
	const [salt, hash] = stored.split(":")
	if (salt === undefined || hash === undefined) {
		return false
	}
	const computed = createHash("sha256")
		.update(salt + password)
		.digest("hex")
	return timingSafeEqual(Buffer.from(hash), Buffer.from(computed))
}

export function createToken(payload: { userId: string }): string {
	const header = Buffer.from(
		JSON.stringify({ alg: "HS256", typ: "JWT" }),
	).toString("base64url")
	const body = Buffer.from(
		JSON.stringify({
			...payload,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 86400 * 7,
		}),
	).toString("base64url")
	const signature = createHash("sha256")
		.update(`${header}.${body}.${JWT_SECRET}`)
		.digest("base64url")
	return `${header}.${body}.${signature}`
}

export function verifyToken(token: string): { userId: string } | null {
	const parts = token.split(".")
	if (parts.length !== 3) {
		return null
	}
	const [header, body, signature] = parts
	if (header === undefined || body === undefined || signature === undefined) {
		return null
	}

	const expectedSig = createHash("sha256")
		.update(`${header}.${body}.${JWT_SECRET}`)
		.digest("base64url")

	if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
		return null
	}

	const payload = parseJson<{ userId: string; exp: number }>(
		Buffer.from(body, "base64url").toString(),
	)

	if (payload.exp < Math.floor(Date.now() / 1000)) {
		return null
	}

	return { userId: payload.userId }
}

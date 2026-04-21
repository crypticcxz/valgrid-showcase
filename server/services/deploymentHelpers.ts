import type { RestartPolicy } from "../../shared/types.ts"
import type { schema } from "./db/index.ts"

type DeploymentRow = typeof schema.deployments.$inferSelect

function isStringRecord(val: unknown): val is Record<string, string> {
	if (typeof val !== "object" || val === null || Array.isArray(val)) {
		return false
	}
	for (const v of Object.values(val)) {
		if (typeof v !== "string") {
			return false
		}
	}
	return true
}

function isRestartPolicy(s: string): s is RestartPolicy {
	return s === "always" || s === "on-failure" || s === "never"
}

export function getEnvVars(deployment: DeploymentRow): Record<string, string> {
	const raw: unknown = deployment.envVars ?? {}
	if (isStringRecord(raw)) {
		return raw
	}
	return {}
}

export function getRestartPolicy(deployment: DeploymentRow): RestartPolicy {
	const policy = deployment.restartPolicy
	if (isRestartPolicy(policy)) {
		return policy
	}
	return "on-failure"
}

export type DeploymentStatus =
	| "pending"
	| "building"
	| "running"
	| "stopped"
	| "failed"
	| "crashed"

export type RestartPolicy = "always" | "on-failure" | "never"

export type Deployment = {
	id: string
	userId: string
	name: string
	status: string
	containerId: string | null
	imageTag: string | null
	archiveKey: string
	entrypoint: string
	envVars: Record<string, string>
	cpuLimit: number
	memoryLimitMb: number
	restartPolicy: string
	createdAt: string
	updatedAt: string
	stoppedAt: string | null
	lastCrashReason: string | null
	restartCount: number
}

export type DeploymentEvent = {
	id: string
	deploymentId: string
	type: string
	message: string | null
	metadata: Record<string, unknown>
	createdAt: string
}

export type DeploymentLog = {
	id: string
	deploymentId: string
	stream: string
	message: string
	createdAt: string
}

export type CreateDeploymentRequest = {
	name: string
	entrypoint?: string
	envVars?: Record<string, string>
	cpuLimit?: number
	memoryLimitMb?: number
	restartPolicy?: RestartPolicy
}

export type UpdateDeploymentRequest = {
	name?: string
	entrypoint?: string
	envVars?: Record<string, string>
	cpuLimit?: number
	memoryLimitMb?: number
	restartPolicy?: RestartPolicy
}

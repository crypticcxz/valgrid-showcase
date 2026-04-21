export const TIER_LIMITS = {
	free: { maxDeployments: 2, cpuLimit: 0.5, memoryLimitMb: 256 },
	pro: { maxDeployments: 10, cpuLimit: 2, memoryLimitMb: 1024 },
	enterprise: { maxDeployments: 50, cpuLimit: 4, memoryLimitMb: 4096 },
} as const

export const DEFAULT_ENTRYPOINT = "main.py"
export const DEFAULT_RESTART_POLICY = "on-failure" as const
export const CONTAINER_PREFIX = "valgrid-"
export const IMAGE_PREFIX = "valgrid-user-"

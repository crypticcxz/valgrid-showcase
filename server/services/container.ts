import Dockerode from "dockerode"
import { CONTAINER_PREFIX } from "../../shared/constants.ts"
import { parseJson } from "../../shared/json.ts"
import type { RestartPolicy } from "../../shared/types.ts"

const docker = new Dockerode({
	socketPath: process.env.DOCKER_SOCKET ?? "/var/run/docker.sock",
})

export async function buildImage(
	contextPath: string,
	tag: string,
): Promise<void> {
	const stream = await docker.buildImage(
		{ context: contextPath, src: ["."] },
		{ t: tag },
	)
	await new Promise<void>((resolve, reject) => {
		docker.modem.followProgress(stream, (err: Error | null) => {
			if (err) {
				reject(err)
			} else {
				resolve()
			}
		})
	})
}

export async function createAndStartContainer(options: {
	deploymentId: string
	imageTag: string
	envVars: Record<string, string>
	cpuLimit: number
	memoryLimitMb: number
	restartPolicy: RestartPolicy
}): Promise<string> {
	const container = await docker.createContainer({
		Image: options.imageTag,
		name: `${CONTAINER_PREFIX}${options.deploymentId}`,
		Env: Object.entries(options.envVars).map(([k, v]) => `${k}=${v}`),
		HostConfig: {
			NanoCpus: Math.round(options.cpuLimit * 1e9),
			Memory: options.memoryLimitMb * 1024 * 1024,
			MemorySwap: options.memoryLimitMb * 1024 * 1024,
			RestartPolicy: {
				Name: options.restartPolicy === "never" ? "" : options.restartPolicy,
				MaximumRetryCount: options.restartPolicy === "on-failure" ? 5 : 0,
			},
			NetworkMode: "bridge",
			ReadonlyRootfs: false,
			SecurityOpt: ["no-new-privileges"],
		},
	})

	await container.start()
	return container.id
}

export async function stopContainer(containerId: string): Promise<void> {
	const container = docker.getContainer(containerId)
	await container.stop({ t: 10 })
}

export async function removeContainer(containerId: string): Promise<void> {
	const container = docker.getContainer(containerId)
	await container.remove({ force: true })
}

export async function getContainerLogs(
	containerId: string,
	tail: number = 200,
): Promise<string> {
	const container = docker.getContainer(containerId)
	const logs = await container.logs({
		stdout: true,
		stderr: true,
		tail,
		timestamps: true,
	})
	return logs.toString()
}

export async function streamContainerLogs(
	containerId: string,
	onData: (chunk: string) => void,
	onError: (err: Error) => void,
): Promise<() => void> {
	const container = docker.getContainer(containerId)
	const stream = await container.logs({
		stdout: true,
		stderr: true,
		follow: true,
		tail: 100,
		timestamps: true,
	})

	stream.on("data", (chunk: Buffer) => {
		onData(chunk.toString())
	})
	stream.on("error", onError)

	const destroyable = stream as NodeJS.ReadableStream & {
		destroy?: () => void
	}
	return () => {
		destroyable.destroy?.()
	}
}

export async function getContainerStats(containerId: string): Promise<{
	cpuPercent: number
	memoryUsageMb: number
	memoryLimitMb: number
	networkRxBytes: number
	networkTxBytes: number
}> {
	const container = docker.getContainer(containerId)
	const stats = await container.stats({ stream: false })

	const cpuDelta =
		stats.cpu_stats.cpu_usage.total_usage -
		stats.precpu_stats.cpu_usage.total_usage
	const systemDelta =
		stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage
	const rawCpus: unknown = stats.cpu_stats.online_cpus
	const numCpus = typeof rawCpus === "number" ? rawCpus : 1
	const cpuPercent =
		systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0

	let networkRx = 0
	let networkTx = 0
	const networks = parseJson<
		Record<string, { rx_bytes: number; tx_bytes: number }>
	>(JSON.stringify(stats.networks))
	for (const net of Object.values(networks)) {
		networkRx += net.rx_bytes
		networkTx += net.tx_bytes
	}

	return {
		cpuPercent: Math.round(cpuPercent * 100) / 100,
		memoryUsageMb: Math.round(stats.memory_stats.usage / 1024 / 1024),
		memoryLimitMb: Math.round(stats.memory_stats.limit / 1024 / 1024),
		networkRxBytes: networkRx,
		networkTxBytes: networkTx,
	}
}

export async function inspectContainer(
	containerId: string,
): Promise<{ running: boolean; exitCode: number; startedAt: string }> {
	const container = docker.getContainer(containerId)
	const info = await container.inspect()
	return {
		running: info.State.Running,
		exitCode: info.State.ExitCode,
		startedAt: info.State.StartedAt,
	}
}

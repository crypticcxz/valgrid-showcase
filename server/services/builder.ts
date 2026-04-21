import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { IMAGE_PREFIX } from "../../shared/constants.ts"
import { buildImage } from "./container.ts"

const BUILD_DIR = process.env.BUILD_DIR ?? "/tmp/valgrid-builds"

const DOCKERFILE_TEMPLATE = `FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt* ./
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || true

COPY . .

CMD ["python", "{{ENTRYPOINT}}"]
`

export async function buildDeploymentImage(
	deploymentId: string,
	codePath: string,
	entrypoint: string,
): Promise<string> {
	const tag = `${IMAGE_PREFIX}${deploymentId}:latest`
	const buildPath = path.join(BUILD_DIR, deploymentId)

	await mkdir(buildPath, { recursive: true })

	const dockerfile = DOCKERFILE_TEMPLATE.replace("{{ENTRYPOINT}}", entrypoint)
	await writeFile(path.join(codePath, "Dockerfile"), dockerfile)

	await buildImage(codePath, tag)

	return tag
}

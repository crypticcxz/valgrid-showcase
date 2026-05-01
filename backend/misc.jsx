export const BLOCKCHAIN_NETWORKS = {
  devnet: {
    label: "Devnet",
    cluster: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
  },
  mainnet: {
    label: "Mainnet",
    cluster: "mainnet-beta",
    rpcUrl: "https://api.mainnet-beta.solana.com",
  },
}

export const RUNTIME_RUNNING = "running"
export const RUNTIME_STOPPED = "stopped"
export const RUNTIME_STARTING = "starting"
export const RUNTIME_CRASHED = "crashed"

const networks = new Set(Object.keys(BLOCKCHAIN_NETWORKS))
const runtimes = new Set([RUNTIME_RUNNING, RUNTIME_STOPPED])

export function reject(status, message) {
  const error = new Error(message)
  error.status = status
  throw error
}

export function objectBody(req) {
  return req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body
    : {}
}

export function has(object, key) {
  return Object.hasOwn(object, key)
}

export function requiredString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    reject(400, `missing ${name}`)
  }
  return value.trim()
}

export function optionalNumber(value, name) {
  if (value === undefined || value === null || value === "") return null
  const number = Number(value)
  if (!Number.isFinite(number)) reject(400, `invalid ${name}`)
  return number
}

export function requiredNumber(value, name) {
  const number = Number(value)
  if (!Number.isFinite(number)) reject(400, `invalid ${name}`)
  return number
}

export function requiredModel(value) {
  if (typeof value === "string" && value.trim()) return value.trim()
  reject(400, "invalid ai_model")
}

export function network(value) {
  if (networks.has(value)) return value
  reject(400, "invalid blockchain_network")
}

export function chain(value) {
  const key = network(value)
  return { network: key, ...BLOCKCHAIN_NETWORKS[key] }
}

export function runtime(value) {
  if (runtimes.has(value)) return value
  reject(400, "invalid desired_runtime")
}

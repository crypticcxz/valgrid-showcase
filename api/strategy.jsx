import express from "express"
import postgres from "postgres"
import bs58 from "bs58"
import nacl from "tweetnacl"
import { randomUUID } from "node:crypto"
import * as child from "node:child_process"
import {
  readdir,
  readFile,
} from "node:fs/promises"
import path from "node:path"
import pidusage from "pidusage"
import { authorize } from "./auth.jsx"
import { ingest } from "./strategy-events.jsx"
import {
  chain,
  runtime,
  network,
  RUNTIME_CRASHED,
  RUNTIME_RUNNING,
  RUNTIME_STARTING,
  RUNTIME_STOPPED,
  has,
  objectBody,
  requiredModel,
  requiredString,
} from "./misc.jsx"

const sql = postgres(process.env.DATABASE_URL)
const outputs = new Map()
const runnerPath = path.join(process.cwd(), "api", "python-runner.py")

function runnerPid(runner) {
  const match = /^process:(\d+)$/.exec(String(runner || ""))
  if (!match) return null
  const pid = Number(match[1])
  return Number.isSafeInteger(pid) && pid > 0 ? pid : null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function signalRunner(pid, signal) {
  try {
    process.kill(-pid, signal)
    return true
  } catch (e) {
    if (e?.code === "ESRCH") return false
    try {
      process.kill(pid, signal)
      return true
    } catch (inner) {
      if (inner?.code === "ESRCH") return false
      throw inner
    }
  }
}

async function killRunner(runner) {
  const pid = runnerPid(runner)
  if (!pid) return false
  if (!signalRunner(pid, "SIGTERM")) return false
  await sleep(1000)
  signalRunner(pid, "SIGKILL")
  return true
}

function stream(strategy) {
  let output = outputs.get(strategy)
  if (!output) {
    output = { clients: new Set() }
    outputs.set(strategy, output)
  }
  return output
}

function output(strategy, chunk) {
  const output = stream(strategy)
  for (const client of output.clients) {
    client.write(chunk)
  }
}

async function notify(account, kind, title, body) {
  try {
    await sql`
      INSERT INTO notifications (account_id, kind, title, body)
      VALUES (${account}, ${kind}, ${title}, ${body ?? null})
    `
  } catch (e) {
    console.error("notify failed:", e)
  }
}

function wait(proc) {
  return new Promise((resolve, reject) => {
    proc.once("error", reject)
    proc.once("exit", (code, signal) => resolve({ code, signal }))
  })
}

function parse(text) {
  const fields = text
    .slice(text.lastIndexOf(") ") + 2)
    .trim()
    .split(/\s+/)
  return {
    ppid: Number(fields[1]),
  }
}

async function collectProcesses(root) {
  const entries = await readdir("/proc", { withFileTypes: true })
  const processes = new Map()

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
      .map(async (entry) => {
        const pid = Number(entry.name)
        try {
          processes.set(
            pid,
            parse(await readFile(`/proc/${pid}/stat`, "utf8")),
          )
        } catch {
          // Processes can exit while /proc is being scanned.
        }
      }),
  )

  const pids = []
  const stack = [root]
  const seen = new Set()
  while (stack.length) {
    const pid = stack.pop()
    if (seen.has(pid)) continue
    seen.add(pid)
    if (processes.has(pid)) pids.push(pid)
    for (const [childPid, child] of processes) {
      if (child.ppid === pid) stack.push(childPid)
    }
  }

  return pids
}

async function usage(root) {
  const pids = await collectProcesses(root)
  if (pids.length === 0) return { cpuSeconds: 0, memoryBytes: 0 }
  const stats = await pidusage(pids)
  let cpuMs = 0
  let memoryBytes = 0
  for (const pid of pids) {
    const stat = stats[pid]
    if (!stat) continue
    cpuMs += Number(stat.ctime)
    memoryBytes += Number(stat.memory)
  }
  return {
    cpuSeconds: cpuMs / 1000,
    memoryBytes,
  }
}

function measure(root) {
  const startedAt = performance.now()
  let latestCpuSeconds = 0
  let peakMemoryBytes = 0

  const sample_ = async () => {
    try {
      const stats = await usage(root)
      latestCpuSeconds = stats.cpuSeconds
      peakMemoryBytes = Math.max(peakMemoryBytes, stats.memoryBytes)
    } catch {
      // The process tree can exit between samples; keep the latest successful reading.
    }
  }

  sample_()
  const interval = setInterval(sample_, 250)

  return {
    end() {
      clearInterval(interval)
      const wallSeconds = (performance.now() - startedAt) / 1000
      const cpuSeconds = latestCpuSeconds
      const costCents = cpuSeconds * 0.001
      return {
        wallSeconds,
        cpuSeconds,
        costCents,
        peakMemoryBytes,
      }
    },
  }
}

function write(strategy, runner, prefix, line) {
  if (line.startsWith(prefix)) {
    return ingest(strategy, runner, prefix, line)
  }
  return Promise.resolve()
}

async function save(strategy, runner, status, usage) {
  try {
    await sql`
      INSERT INTO strategy_runs (
        strategy_id,
        account_id,
        runner_id,
        exit_code,
        cpu_seconds,
        wall_seconds,
        cpu_limit,
        memory_limit_mb,
        peak_memory_bytes,
        cost_cents
      )
      VALUES (
        ${strategy.id},
        ${strategy.account_id},
        ${runner},
        ${status},
        ${usage.cpuSeconds},
        ${usage.wallSeconds},
        1,
        256,
        ${usage.peakMemoryBytes},
        ${usage.costCents}
      )
      `
  } catch (e) {
    console.error("strategy run insert failed:", e)
  }
}

const runs = new Map()

async function updateRuntime(strategy, requestedAt, fields) {
  const requested = requestedAt ?? null
  const desired = fields.desired_runtime ?? null
  const actual = fields.actual_runtime ?? null
  const runner = fields.runtime_runner_id ?? null
  const clearRunner = fields.clear_runner_id ?? false
  await sql`
    UPDATE strategies
       SET desired_runtime = CASE
             WHEN ${desired}::text IS NULL THEN desired_runtime
             ELSE ${desired}::text
           END,
           actual_runtime = CASE
             WHEN ${actual}::text IS NULL THEN actual_runtime
             ELSE ${actual}::text
           END,
           runtime_runner_id = CASE
             WHEN ${clearRunner} THEN NULL
             WHEN ${runner}::text IS NULL THEN runtime_runner_id
             ELSE ${runner}::text
           END
     WHERE id = ${strategy}
       AND (
         ${requested}::timestamptz IS NULL
         OR runtime_requested_at IS NOT DISTINCT FROM ${requested}::timestamptz
       )
  `
}

async function stop(strategy, requestedAt, terminate) {
  const runner = runs.get(strategy)
  if (terminate && runner) {
    await runner.end()
  }
  await updateRuntime(strategy, requestedAt, {
    desired_runtime: RUNTIME_STOPPED,
    actual_runtime: RUNTIME_STOPPED,
    clear_runner_id: true,
  })
  runs.delete(strategy)
  return runner
}

async function spawn(strategy) {
  if (runs.has(strategy.id)) {
    return
  }
  if (
    !strategy.strategy_wallet_id ||
    !strategy.strategy_wallet_address
  ) {
    throw new Error("strategy wallet missing")
  }
  let meter
  try {
    const active = chain(strategy.blockchain_network)
    const accountEnv = await accountEnvironment(strategy.account_id)
    const prefix = `__VALGRID_EVENT__:${randomUUID()}:`
    const proc = child.spawn(
      "/usr/bin/python3",
      ["-u", runnerPath],
      {
        detached: true,
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...accountEnv,
          PATH: "/usr/local/bin:/usr/bin:/bin",
          PYTHONUNBUFFERED: "1",
          SOLANA_CLUSTER: active.cluster,
          SOLANA_RPC_URL: active.rpcUrl,
          VALGRID_BLOCKCHAIN_NETWORK: active.network,
          VALGRID_EVENT_PREFIX: prefix,
          VALGRID_STRATEGY_WALLET_ID: strategy.strategy_wallet_id,
          VALGRID_STRATEGY_WALLET_ADDRESS: strategy.strategy_wallet_address,
        },
      },
    )
    proc.stdin.end(strategy.code)
    const runner = `process:${proc.pid}`
    const writes = []
    let buffer = ""
    runs.set(strategy.id, {
      pid: proc.pid,
      end: () => killRunner(runner),
    })
    await updateRuntime(strategy.id, strategy.runtime_requested_at, {
      actual_runtime: RUNTIME_RUNNING,
      runtime_runner_id: runner,
    })
    meter = measure(proc.pid)

    proc.stdout.on("data", (chunk) => {
      output(strategy.id, chunk)
      buffer += String(chunk)
      if (buffer.length > 200000 && !buffer.includes("\n")) {
        buffer = ""
        return
      }
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop()
      for (const line of lines
        .map((value) => value.trimEnd())
        .filter(Boolean)) {
        const wrote = write(strategy, runner, prefix, line).catch((e) =>
          console.error("runner event handling failed:", e),
        )
        writes.push(wrote)
      }
    })
    proc.stderr.on("data", (chunk) => {
      output(strategy.id, chunk)
    })

    const { code, signal } = await wait(proc)
    await updateRuntime(strategy.id, strategy.runtime_requested_at, {
      desired_runtime: RUNTIME_STOPPED,
      actual_runtime: code === 0 && !signal ? RUNTIME_STOPPED : RUNTIME_CRASHED,
      clear_runner_id: true,
    })
    runs.delete(strategy.id)
    if (buffer.trim()) {
      writes.push(
        write(strategy, runner, prefix, buffer.trimEnd()).catch((e) =>
          console.error("runner event handling failed:", e),
        ),
      )
    }
    await Promise.all(writes)
    const usage = meter.end()
    await save(strategy, runner, code, usage)
    if (code !== 0 || signal) {
      await notify(
        strategy.account_id,
        "strategy.crashed",
        `Strategy crashed: ${strategy.name}`,
        `Runner exited with code ${code} signal ${signal}`,
      )
    }
  } finally {
    if (runs.has(strategy.id)) {
      await stop(strategy.id, strategy.runtime_requested_at, false)
    }
  }
}

async function accountEnvironment(account) {
  const rows = await sql`
    SELECT account_secret_env_vars.name,
           account_secret_env_var_values.secret_value
      FROM account_secret_env_vars
      JOIN account_secret_env_var_values
        ON account_secret_env_var_values.env_var_id = account_secret_env_vars.id
     WHERE account_secret_env_vars.account_id = ${account}
       AND account_secret_env_vars.archived_at IS NULL
  `
  return Object.fromEntries(
    rows.map((row) => [row.name, row.secret_value]),
  )
}

async function update(account, strategy, body) {
  const patch = { ...body }
  if (patch.blockchain_network !== undefined) {
    patch.blockchain_network = network(patch.blockchain_network)
  }
  if (patch.ai_model !== undefined) {
    patch.ai_model = requiredModel(patch.ai_model)
  }
  if (patch.desired_runtime !== undefined) {
    patch.desired_runtime = runtime(patch.desired_runtime)
  }
  const [row] = await sql`
    WITH patch AS (
      SELECT ${sql.json(patch)}::jsonb AS body
    ),
    updated AS (
      UPDATE strategies
         SET name = CASE WHEN patch.body ? 'name' THEN patch.body->>'name' ELSE strategies.name END,
             blockchain_network = CASE
               WHEN patch.body ? 'blockchain_network' THEN patch.body->>'blockchain_network'
               ELSE strategies.blockchain_network
             END,
             tags = CASE
               WHEN patch.body ? 'tags' THEN ARRAY(
                 SELECT jsonb_array_elements_text(patch.body->'tags')
             )
               ELSE strategies.tags
             END,
             is_public = CASE WHEN patch.body ? 'is_public' THEN (patch.body->>'is_public')::boolean ELSE strategies.is_public END,
             is_starred = CASE
               WHEN patch.body ? 'is_starred' THEN (patch.body->>'is_starred')::boolean
               ELSE strategies.is_starred
             END,
             code = CASE WHEN patch.body ? 'code' THEN patch.body->>'code' ELSE strategies.code END,
             ai_model = CASE WHEN patch.body ? 'ai_model' THEN patch.body->>'ai_model' ELSE strategies.ai_model END,
             desired_runtime = CASE WHEN patch.body ? 'desired_runtime' THEN patch.body->>'desired_runtime' ELSE strategies.desired_runtime END,
             actual_runtime = CASE
               WHEN patch.body ? 'desired_runtime' AND patch.body->>'desired_runtime' = 'running' THEN ${RUNTIME_STARTING}
               WHEN patch.body ? 'desired_runtime' AND patch.body->>'desired_runtime' = 'stopped' THEN ${RUNTIME_STOPPED}
               ELSE strategies.actual_runtime
             END,
             runtime_requested_at = CASE
               WHEN patch.body ? 'runtime_requested_at' THEN (patch.body->>'runtime_requested_at')::timestamptz
               ELSE strategies.runtime_requested_at
             END,
             archived_at = CASE WHEN patch.body ? 'archived_at' THEN (patch.body->>'archived_at')::timestamptz ELSE strategies.archived_at END
        FROM patch
       WHERE id = ${strategy}
         AND account_id = ${account}
       RETURNING *
    )
    SELECT
      updated.id,
      updated.account_id,
      updated.name,
      updated.blockchain_network,
      updated.tags,
      updated.is_public,
      updated.is_starred,
      updated.code,
      updated.ai_model,
      updated.desired_runtime,
      updated.actual_runtime,
      updated.runtime_runner_id,
      updated.runtime_requested_at,
      updated.archived_at,
      updated.created_at,
      strategy_wallets.id AS strategy_wallet_id,
      strategy_wallets.address AS strategy_wallet_address
    FROM updated
    JOIN strategy_wallets ON strategy_wallets.strategy_id = updated.id
      AND strategy_wallets.account_id = updated.account_id
  `
  return row ?? null
}

async function create(account, strategy, body) {
  const name = requiredString(body?.name, "name")
  const net = network(requiredString(body?.blockchain_network, "blockchain_network"))
  const aiModel = requiredModel(body?.ai_model)
  const strategyTags =
    Array.isArray(body?.tags)
      ? body.tags
      : reject(400, "invalid tags")
  const strategyCode = typeof body?.code === "string" ? body.code : null
  if (typeof strategyCode !== "string") {
    return reject(400, "missing code")
  }
  const isPublic =
    typeof body?.is_public === "boolean"
      ? body.is_public
      : reject(400, "invalid is_public")
  const isStarred =
    typeof body?.is_starred === "boolean"
      ? body.is_starred
      : reject(400, "invalid is_starred")
  const desiredRuntime = requiredString(body?.desired_runtime, "desired_runtime")
  runtime(desiredRuntime)
  const keypair = nacl.sign.keyPair()
  const address = bs58.encode(keypair.publicKey)
  const [row] = await sql`
    WITH strategy AS (
      INSERT INTO strategies (
        id,
        account_id,
        name,
        blockchain_network,
        tags,
        is_public,
        is_starred,
        code,
        ai_model,
        desired_runtime,
        actual_runtime
      )
      VALUES (
        ${strategy}::uuid,
        ${account},
        ${name},
        ${net},
        ${strategyTags}::text[],
        ${isPublic},
        ${isStarred},
        ${strategyCode},
        ${aiModel},
        ${desiredRuntime},
        ${desiredRuntime === RUNTIME_RUNNING ? RUNTIME_STARTING : RUNTIME_STOPPED}
      )
      RETURNING *
    ),
    wallet AS (
      INSERT INTO strategy_wallets (strategy_id, account_id, chain, address)
      SELECT strategy.id, strategy.account_id, 'solana', ${address}
      FROM strategy
      RETURNING id, address
    )
    SELECT
      strategy.*,
      wallet.id AS strategy_wallet_id,
      wallet.address AS strategy_wallet_address
    FROM strategy
    JOIN wallet ON true
  `
  return row
}

async function applyRuntime(row) {
  try {
    if (!row || row.archived_at) {
      throw new Error("strategy not found")
    }

    if (row.desired_runtime === RUNTIME_STOPPED) {
      await stop(row.id, row.runtime_requested_at, true)
    } else {
      await run(row)
    }
  } catch (e) {
    console.error("strategy runtime change failed:", e)
  }
}

async function run(row) {
  if (runs.has(row.id)) {
    return
  }

  chain(row.blockchain_network)
  spawn(row).catch(async (e) => {
    console.error("strategy launch failed", row.id, e)
    await stop(row.id, row.runtime_requested_at, false)
    await notify(
      row.account_id,
      "strategy.crashed",
      `Strategy crashed: ${row.name}`,
      e.message,
    )
  })
}

export async function stopStaleStrategyRuntime() {
  const stale = await sql`
    SELECT id, runtime_runner_id
      FROM strategies
     WHERE desired_runtime = 'running'
        OR actual_runtime IN ('starting', 'running')
  `
  await Promise.all(
    stale.map(async (strategy) => {
      try {
        await killRunner(strategy.runtime_runner_id)
      } catch (e) {
        console.error("stale strategy runner cleanup failed:", e)
      }
    }),
  )
  await sql`
    UPDATE strategies
       SET desired_runtime = ${RUNTIME_STOPPED},
           actual_runtime = ${RUNTIME_CRASHED},
           runtime_runner_id = NULL
     WHERE desired_runtime = 'running'
        OR actual_runtime IN ('starting', 'running')
  `
}

export const strategyRoutes = express.Router()

strategyRoutes.get(
  "/strategies/:id/output",
  authorize,
  async (req, res, next) => {
    try {
      const [row] = await sql`
        SELECT id
        FROM strategies
        WHERE id = ${req.params.id}
          AND account_id = ${req.account}
        LIMIT 1
      `
      if (!row) return res.status(404).json({ error: "not found" })

      const output = stream(req.params.id)
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        Connection: "keep-alive",
      })
      res.flushHeaders()
      output.clients.add(res)
      req.on("close", () => output.clients.delete(res))
    } catch (e) {
      next(e)
    }
  },
)

strategyRoutes.patch("/strategies/:id", authorize, async (req, res, next) => {
  try {
    const body = objectBody(req)
    const runtimeChange =
      has(body, "desired_runtime") || has(body, "runtime_requested_at")
    let strategy = await update(req.account, req.params.id, body)
    const created = !strategy
    if (created) {
      strategy = await create(req.account, req.params.id, body)
      notify(req.account, "strategy.created", `Created "${strategy.name}"`)
    }
    if (runtimeChange) {
      applyRuntime(strategy).catch((e) =>
        console.error("strategy runtime change failed:", e),
      )
    }
    res.json(strategy)
  } catch (e) {
    next(e)
  }
})

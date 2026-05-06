import express from "express"
import postgres from "postgres"
import {
  attribute,
  observe,
  observed,
  record,
} from "./strategy-events.jsx"
import { requiredString } from "./misc.jsx"

const sql = postgres(process.env.DATABASE_URL)

function token(req, res, next, key, name) {
  const expected = process.env[key]
  if (!expected) return res.status(503).json({ error: `${name} not configured` })
  const header =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization
      : ""
  const value = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (value !== expected) return res.status(401).json({ error: "bad token" })
  next()
}

function reconcile(req, res, next) {
  token(req, res, next, "RECONCILER_TOKEN", "reconciler")
}

export const strategyReconcilerRoutes = express.Router()

strategyReconcilerRoutes.patch(
  "/reconciler/strategies/:id/trades",
  reconcile,
  async (req, res, next) => {
    try {
      const input = req.body?.trades
      if (!Array.isArray(input) || input.length === 0) {
        return res.status(400).json({ error: "missing trades" })
      }
      const trades = input.map(observed)
      const identities = new Set()
      for (const trade of trades) {
        const identity = `${trade.observation_source}:${trade.observed_id}`
        if (identities.has(identity)) {
          return res.status(400).json({ error: "duplicate observed trade" })
        }
        identities.add(identity)
      }

      const [strategy] = await sql`
        SELECT
          strategies.id,
          strategies.account_id,
          strategies.name,
          strategies.blockchain_network,
          strategy_wallets.id AS strategy_wallet_id,
          strategy_wallets.address AS strategy_wallet_address
        FROM strategies
        JOIN strategy_wallets ON strategy_wallets.strategy_id = strategies.id
          AND strategy_wallets.account_id = strategies.account_id
        WHERE strategies.id = ${req.params.id}
          AND strategies.archived_at IS NULL
        LIMIT 1
      `
      if (!strategy) return res.status(404).json({ error: "not found" })

      await sql.begin(async (tx) => {
        for (const trade of trades) {
          const attributed = await attribute(tx, strategy, trade)
          await record(strategy, "reconciler", attributed, tx)
          await observe(tx, attributed)
        }
      })

      res.json({ ok: true, count: trades.length })
    } catch (e) {
      next(e)
    }
  },
)

strategyReconcilerRoutes.get(
  "/reconciler/wallets",
  reconcile,
  async (req, res, next) => {
    try {
      const source = requiredString(req.query.source, "source")
      const wallets = await sql`
        SELECT
          strategy_wallets.id,
          strategy_wallets.strategy_id,
          strategy_wallets.account_id,
          strategy_wallets.address,
          strategy_wallets.chain,
          strategies.blockchain_network,
          observers.cursor,
          observers.observed_at
        FROM strategy_wallets
        JOIN strategies ON strategies.id = strategy_wallets.strategy_id
        LEFT JOIN strategy_wallet_observers observers
          ON observers.strategy_wallet_id = strategy_wallets.id
         AND observers.observation_source = ${source}
        WHERE strategies.archived_at IS NULL
        ORDER BY observers.observed_at ASC NULLS FIRST, strategy_wallets.created_at ASC
      `
      res.json({ wallets })
    } catch (e) {
      next(e)
    }
  },
)

strategyReconcilerRoutes.patch(
  "/reconciler/wallets/:id",
  reconcile,
  async (req, res, next) => {
    try {
      const source = requiredString(
        req.body?.observation_source,
        "observation_source",
      )
      const cursor = requiredString(req.body?.cursor, "cursor")
      const observedAt = requiredString(req.body?.observed_at, "observed_at")
      const [row] = await sql`
        INSERT INTO strategy_wallet_observers (
          strategy_wallet_id,
          observation_source,
          cursor,
          observed_at
        )
        SELECT
          strategy_wallets.id,
          ${source},
          ${cursor},
          ${observedAt}::timestamptz
        FROM strategy_wallets
        WHERE strategy_wallets.id = ${req.params.id}
        ON CONFLICT (strategy_wallet_id, observation_source)
        DO UPDATE SET
          cursor = EXCLUDED.cursor,
          observed_at = EXCLUDED.observed_at
        RETURNING *
      `
      if (!row) return res.status(404).json({ error: "wallet not found" })
      res.json(row)
    } catch (e) {
      next(e)
    }
  },
)

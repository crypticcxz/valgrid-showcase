import express from "express"
import postgres from "postgres"
import {
  BLOCKCHAIN_NETWORKS,
  has,
  objectBody,
  reject,
  requiredNumber,
} from "./misc.jsx"
import { authorize } from "./auth.jsx"

const sql = postgres(process.env.DATABASE_URL)

async function solanaBalance(address, rpcUrl) {
  const response = await globalThis.fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "valgrid-balance",
      method: "getBalance",
      params: [address],
    }),
  })
  const payload = await response.json()
  if (!response.ok || payload.error) {
    const message = payload.error
      ? payload.error.message
      : "balance request failed"
    throw new Error(message)
  }
  if (!payload.result || typeof payload.result.value !== "number") {
    throw new Error("balance response missing value")
  }
  return Number(payload.result.value)
}

async function solanaAirdrop(address, lamports, rpcUrl) {
  const response = await globalThis.fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "valgrid-airdrop",
      method: "requestAirdrop",
      params: [address, lamports],
    }),
  })
  const payload = await response.json()
  if (!response.ok || payload.error) {
    const message = payload.error
      ? payload.error.message
      : "airdrop request failed"
    throw new Error(message)
  }
  if (!payload.result) {
    throw new Error("airdrop response missing signature")
  }
  return payload.result
}

async function networkBalances(wallet) {
  if (wallet.chain !== "solana") return []
  return Promise.all(
    Object.entries(BLOCKCHAIN_NETWORKS).map(async ([network, config]) => {
      try {
        return {
          network,
          lamports: await solanaBalance(wallet.address, config.rpcUrl),
          error: null,
        }
      } catch (e) {
        return {
          network,
          lamports: null,
          error: e.message,
        }
      }
    }),
  )
}

async function refreshAll(label, wallets, refresh) {
  const results = await Promise.allSettled(
    wallets.map((wallet) => refresh(wallet)),
  )
  const failed = results.filter((result) => result.status === "rejected")
  if (failed.length > 0) {
    console.error(
      `${label} refresh reconciliation failed for ${failed.length} wallets`,
    )
  }
}

async function refreshBalances(wallet) {
  try {
    await sql`
      UPDATE wallets
         SET balance_refresh_started_at = now(),
             balance_refresh_finished_at = NULL,
             balance_refresh_error = NULL
       WHERE id = ${wallet.id}
         AND account_id = ${wallet.account_id}
    `

    const balances = await networkBalances(wallet)

    await sql`
      WITH input AS (
        SELECT *
        FROM jsonb_to_recordset(${sql.json(balances)}::jsonb)
          AS balance(network text, lamports bigint, error text)
      ),
      upserted AS (
        INSERT INTO wallet_balances (
          wallet_id,
          account_id,
          network,
          lamports,
          error,
          refreshed_at
        )
        SELECT
          ${wallet.id},
          ${wallet.account_id},
          input.network,
          input.lamports,
          input.error,
          now()
        FROM input
        ON CONFLICT (wallet_id, network)
        DO UPDATE SET
          lamports = EXCLUDED.lamports,
          error = EXCLUDED.error,
          refreshed_at = EXCLUDED.refreshed_at,
          updated_at = now()
        WHERE wallet_balances.account_id = EXCLUDED.account_id
      )
      UPDATE wallets
         SET balance_refresh_finished_at = now(),
             balance_refresh_error = NULL
       WHERE id = ${wallet.id}
         AND account_id = ${wallet.account_id}
    `
  } catch (e) {
    await sql`
      UPDATE wallets
         SET balance_refresh_finished_at = now(),
             balance_refresh_error = ${e.message}
       WHERE id = ${wallet.id}
         AND account_id = ${wallet.account_id}
    `
    console.error("wallet balance refresh failed:", e)
  }
}

async function refreshStrategyWalletBalances(wallet) {
  try {
    await sql`
      UPDATE strategy_wallets
         SET balance_refresh_started_at = now(),
             balance_refresh_finished_at = NULL,
             balance_refresh_error = NULL
       WHERE id = ${wallet.id}
         AND account_id = ${wallet.account_id}
    `

    const balances = await networkBalances(wallet)

    await sql`
      WITH input AS (
        SELECT *
        FROM jsonb_to_recordset(${sql.json(balances)}::jsonb)
          AS balance(network text, lamports bigint, error text)
      ),
      upserted AS (
        INSERT INTO strategy_wallet_balances (
          strategy_wallet_id,
          strategy_id,
          account_id,
          network,
          lamports,
          error,
          refreshed_at
        )
        SELECT
          ${wallet.id},
          ${wallet.strategy_id},
          ${wallet.account_id},
          input.network,
          input.lamports,
          input.error,
          now()
        FROM input
        ON CONFLICT (strategy_wallet_id, network)
        DO UPDATE SET
          lamports = EXCLUDED.lamports,
          error = EXCLUDED.error,
          refreshed_at = EXCLUDED.refreshed_at,
          updated_at = now()
        WHERE strategy_wallet_balances.account_id = EXCLUDED.account_id
      )
      UPDATE strategy_wallets
         SET balance_refresh_finished_at = now(),
             balance_refresh_error = NULL
       WHERE id = ${wallet.id}
         AND account_id = ${wallet.account_id}
    `
  } catch (e) {
    await sql`
      UPDATE strategy_wallets
         SET balance_refresh_finished_at = now(),
             balance_refresh_error = ${e.message}
       WHERE id = ${wallet.id}
         AND account_id = ${wallet.account_id}
    `
    console.error("strategy wallet balance refresh failed:", e)
  }
}

async function fundStrategyWallet(request) {
  try {
    const [wallet] = await sql`
      UPDATE strategy_wallet_funding_requests
         SET status = 'processing',
             error = NULL
       WHERE id = ${request.id}
         AND status = 'pending'
       RETURNING *
    `
    if (!wallet) return
    const lamports = Math.round(Number(request.amount_sol) * 1_000_000_000)
    if (!Number.isSafeInteger(lamports) || lamports <= 0) {
      reject(400, "invalid amount_sol")
    }
    const signature = await solanaAirdrop(
      request.address,
      lamports,
      BLOCKCHAIN_NETWORKS.devnet.rpcUrl,
    )
    await sql`
      UPDATE strategy_wallet_funding_requests
         SET status = 'complete',
             signature = ${signature},
             completed_at = now()
       WHERE id = ${request.id}
    `
    await refreshStrategyWalletBalances(request)
  } catch (e) {
    await sql`
      UPDATE strategy_wallet_funding_requests
         SET status = 'failed',
             error = ${e.message},
             completed_at = now()
       WHERE id = ${request.id}
    `
    console.error("strategy wallet funding failed:", e)
  }
}

export async function reconcileWalletRefreshes() {
  const wallets = await sql`
    SELECT *
    FROM wallets
    WHERE archived_at IS NULL
      AND balance_refresh_requested_at IS NOT NULL
      AND (
        balance_refresh_finished_at IS NULL
        OR balance_refresh_requested_at > balance_refresh_finished_at
      )
  `
  await refreshAll("wallet", wallets, refreshBalances)

  const strategyWallets = await sql`
    SELECT *
    FROM strategy_wallets
    WHERE balance_refresh_requested_at IS NOT NULL
      AND (
        balance_refresh_finished_at IS NULL
        OR balance_refresh_requested_at > balance_refresh_finished_at
      )
  `
  await refreshAll(
    "strategy wallet",
    strategyWallets,
    refreshStrategyWalletBalances,
  )
}

export const walletRoutes = express.Router()

walletRoutes.patch("/wallets/:id", authorize, async (req, res, next) => {
  try {
    const body = objectBody(req)
    const hasArchived = has(body, "archived_at")
    const hasRefresh = has(body, "balance_refresh_requested_at")
    const archivedAt = hasArchived ? body.archived_at : null
    const refreshRequestedAt = hasRefresh
      ? body.balance_refresh_requested_at
      : null
    if (!hasArchived && !hasRefresh) {
      return res.status(400).json({ error: "no wallet changes" })
    }
    const [row] = await sql`
      WITH target AS (
        SELECT wallets.*
        FROM wallets
        JOIN accounts ON accounts.id = wallets.account_id
        WHERE wallets.id = ${req.params.id}
          AND wallets.account_id = ${req.account}
      ),
      updated AS (
        UPDATE wallets
           SET archived_at = CASE
                 WHEN ${hasArchived} THEN ${archivedAt}::timestamptz
                 ELSE wallets.archived_at
               END,
               balance_refresh_requested_at = CASE
                 WHEN ${hasRefresh} THEN ${refreshRequestedAt}::timestamptz
                 ELSE wallets.balance_refresh_requested_at
               END,
               balance_refresh_started_at = CASE
                 WHEN ${hasRefresh} THEN NULL
                 ELSE wallets.balance_refresh_started_at
               END,
               balance_refresh_finished_at = CASE
                 WHEN ${hasRefresh} THEN NULL
                 ELSE wallets.balance_refresh_finished_at
               END,
               balance_refresh_error = CASE
                 WHEN ${hasRefresh} THEN NULL
                 ELSE wallets.balance_refresh_error
               END
         WHERE id = ${req.params.id}
           AND account_id = ${req.account}
           AND (
             NOT ${hasArchived}
             OR ${archivedAt}::timestamptz IS NULL
             OR NOT EXISTS (
               SELECT 1
               FROM accounts
               WHERE id = ${req.account}
                 AND primary_wallet_id = ${req.params.id}
             )
           )
         RETURNING wallets.*
      )
      SELECT
        EXISTS (SELECT 1 FROM target) AS found,
        EXISTS (
          SELECT 1
          FROM accounts
          WHERE id = ${req.account}
            AND primary_wallet_id = ${req.params.id}
        ) AS primary,
        to_jsonb(updated.*) AS wallet
      FROM updated
      UNION ALL
      SELECT
        EXISTS (SELECT 1 FROM target) AS found,
        EXISTS (
          SELECT 1
          FROM accounts
          WHERE id = ${req.account}
            AND primary_wallet_id = ${req.params.id}
        ) AS primary,
        NULL AS wallet
      WHERE NOT EXISTS (SELECT 1 FROM updated)
      LIMIT 1
    `
    if (!row.found) return res.status(404).json({ error: "not found" })
    if (row.primary && hasArchived && archivedAt) {
      return res.status(400).json({ error: "login wallet cannot be archived" })
    }
    if (hasRefresh && row.wallet) {
      refreshBalances(row.wallet).catch((e) =>
        console.error("wallet balance refresh dispatch failed:", e),
      )
    }
    res.json(row.wallet)
  } catch (e) {
    next(e)
  }
})

walletRoutes.patch("/strategy-wallets/:id", authorize, async (req, res, next) => {
  try {
    const body = objectBody(req)
    const hasRefresh = has(body, "balance_refresh_requested_at")
    const refreshRequestedAt = hasRefresh
      ? body.balance_refresh_requested_at
      : null
    if (!hasRefresh) {
      return res.status(400).json({ error: "no strategy wallet changes" })
    }
    const [row] = await sql`
      UPDATE strategy_wallets
         SET balance_refresh_requested_at = ${refreshRequestedAt}::timestamptz,
             balance_refresh_started_at = NULL,
             balance_refresh_finished_at = NULL,
             balance_refresh_error = NULL
       WHERE id = ${req.params.id}
         AND account_id = ${req.account}
       RETURNING *
    `
    if (!row) return res.status(404).json({ error: "not found" })
    refreshStrategyWalletBalances(row).catch((e) =>
      console.error("strategy wallet balance refresh dispatch failed:", e),
    )
    res.json(row)
  } catch (e) {
    next(e)
  }
})

walletRoutes.patch("/strategy-wallet-funding-requests/:id", authorize, async (req, res, next) => {
  try {
    const body = objectBody(req)
    if (body.network !== "devnet") {
      reject(400, "strategy wallet funding is only available on devnet")
    }
    const amountSol = requiredNumber(body.amount_sol, "amount_sol")
    if (amountSol <= 0) reject(400, "invalid amount_sol")
    if (amountSol > 2) reject(400, "amount_sol must be 2 or less")
    const [request] = await sql`
      WITH existing AS (
        SELECT *, false AS inserted
        FROM strategy_wallet_funding_requests
        WHERE id = ${req.params.id}
          AND account_id = ${req.account}
      ),
      inserted AS (
        INSERT INTO strategy_wallet_funding_requests (
          id,
          strategy_wallet_id,
          strategy_id,
          account_id,
          network,
          amount_sol
        )
        SELECT
          ${req.params.id}::uuid,
          strategy_wallets.id,
          strategy_wallets.strategy_id,
          strategy_wallets.account_id,
          ${body.network},
          ${amountSol}
        FROM strategy_wallets
        WHERE strategy_wallets.id = ${body.strategy_wallet_id}
          AND strategy_wallets.account_id = ${req.account}
          AND NOT EXISTS (SELECT 1 FROM existing)
        ON CONFLICT (id) DO NOTHING
        RETURNING *, true AS inserted
      )
      SELECT * FROM inserted
      UNION ALL
      SELECT * FROM existing
      LIMIT 1
    `
    if (!request) return res.status(404).json({ error: "strategy wallet not found" })
    if (request.inserted) {
      const [funding] = await sql`
        SELECT
          strategy_wallet_funding_requests.*,
          strategy_wallets.address,
          strategy_wallets.chain
        FROM strategy_wallet_funding_requests
        JOIN strategy_wallets
          ON strategy_wallets.id = strategy_wallet_funding_requests.strategy_wallet_id
        WHERE strategy_wallet_funding_requests.id = ${request.id}
      `
      fundStrategyWallet(funding).catch((e) =>
        console.error("strategy wallet funding dispatch failed:", e),
      )
    }
    delete request.inserted
    res.json(request)
  } catch (e) {
    next(e)
  }
})

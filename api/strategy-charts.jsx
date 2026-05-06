import express from "express"
import postgres from "postgres"
import { authorize } from "./auth.jsx"
import { has, objectBody, reject, requiredString } from "./misc.jsx"

const sql = postgres(process.env.DATABASE_URL)

export const strategyChartRoutes = express.Router()

strategyChartRoutes.patch(
  "/strategy-charts/:id",
  authorize,
  async (req, res, next) => {
    try {
      const body = objectBody(req)
      const patch = { ...body }
      if (
        patch.contract_address !== undefined &&
        (typeof patch.contract_address !== "string" ||
          !patch.contract_address.trim())
      ) {
        reject(400, "invalid contract_address")
      }
      if (typeof patch.contract_address === "string") {
        patch.contract_address = patch.contract_address.trim()
      }
      if (patch.title !== undefined && typeof patch.title !== "string") {
        reject(400, "invalid title")
      }
      const hasTitle = has(patch, "title")
      const hasContract = has(patch, "contract_address")
      const hasArchived = has(patch, "archived_at")
      const title = hasTitle ? patch.title.trim() : null
      const contract = hasContract ? patch.contract_address : null
      const archivedAt = hasArchived ? patch.archived_at : null
      const [updated] = await sql`
        UPDATE strategy_charts
           SET title = CASE WHEN ${hasTitle} THEN ${title} ELSE strategy_charts.title END,
               contract_address = CASE WHEN ${hasContract} THEN ${contract} ELSE strategy_charts.contract_address END,
               archived_at = CASE WHEN ${hasArchived} THEN ${archivedAt}::timestamptz ELSE strategy_charts.archived_at END
         WHERE id = ${req.params.id}
           AND account_id = ${req.account}
         RETURNING *
      `
      if (updated) return res.json(updated)

      const strategy = requiredString(patch.strategy_id, "strategy_id")
      const insertContract = requiredString(
        patch.contract_address,
        "contract_address",
      )
      const insertTitle = requiredString(patch.title, "title")
      const [chart] = await sql`
        INSERT INTO strategy_charts (
          id,
          strategy_id,
          account_id,
          title,
          contract_address,
          network,
          archived_at
        )
        SELECT
          ${req.params.id}::uuid,
          strategies.id,
          strategies.account_id,
          ${insertTitle},
          ${insertContract},
          'solana',
          ${archivedAt}::timestamptz
        FROM strategies
        WHERE strategies.id = ${strategy}
          AND strategies.account_id = ${req.account}
          AND strategies.archived_at IS NULL
        RETURNING *
      `
      if (!chart) return res.status(404).json({ error: "strategy not found" })
      res.json(chart)
    } catch (e) {
      next(e)
    }
  },
)

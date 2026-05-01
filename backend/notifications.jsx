import express from "express"
import postgres from "postgres"
import { authorize } from "./auth.jsx"
import { has, objectBody } from "./misc.jsx"

const sql = postgres(process.env.DATABASE_URL)

export const notificationRoutes = express.Router()

notificationRoutes.patch(
  "/notifications/:id",
  authorize,
  async (req, res, next) => {
    try {
      const body = objectBody(req)
      if (!has(body, "read_at")) {
        return res.status(400).json({ error: "missing read_at" })
      }
      const [row] = await sql`
        UPDATE notifications
        SET read_at = ${body.read_at}::timestamptz
        WHERE id = ${req.params.id} AND account_id = ${req.account}
        RETURNING *
      `
      if (!row) return res.status(404).json({ error: "not found" })
      res.json(row)
    } catch (e) {
      next(e)
    }
  },
)

import express from "express"
import postgres from "postgres"
import { authorize } from "./auth.jsx"
import { has, objectBody, reject } from "./misc.jsx"

const sql = postgres(process.env.DATABASE_URL)

const RESERVED = /^(VALGRID_|SOLANA_|PATH$|PYTHONUNBUFFERED$)/

function name(value) {
  const text = typeof value === "string" ? value.trim().toUpperCase() : ""
  if (!/^[A-Z_][A-Z0-9_]*$/.test(text)) reject(400, "invalid env var name")
  if (RESERVED.test(text)) reject(400, "reserved env var name")
  return text
}

function secret(value) {
  if (typeof value !== "string") reject(400, "invalid secret value")
  return value
}

export const accountEnvVarRoutes = express.Router()

accountEnvVarRoutes.patch(
  "/account-env-vars/:id",
  authorize,
  async (req, res, next) => {
    try {
      const body = objectBody(req)
      const patch = { ...body }
      const hasName = has(patch, "name")
      const hasSecret = has(patch, "secret_value")
      const hasArchived = has(patch, "archived_at")
      const nextName = hasName ? name(patch.name) : null
      const nextSecret = hasSecret ? secret(patch.secret_value) : null
      const archivedAt = hasArchived ? patch.archived_at : null

      const [updated] = await sql.begin(async (tx) => {
        const [envVar] = await tx`
          UPDATE account_secret_env_vars
             SET name = CASE WHEN ${hasName} THEN ${nextName} ELSE name END,
                 archived_at = CASE WHEN ${hasArchived} THEN ${archivedAt}::timestamptz ELSE archived_at END,
                 updated_at = now()
           WHERE id = ${req.params.id}
             AND account_id = ${req.account}
           RETURNING id, account_id, name, archived_at, created_at, updated_at
        `
        if (!envVar) return []
        if (hasSecret) {
          await tx`
            INSERT INTO account_secret_env_var_values (env_var_id, secret_value)
            VALUES (${envVar.id}, ${nextSecret})
            ON CONFLICT (env_var_id) DO UPDATE
              SET secret_value = EXCLUDED.secret_value,
                  updated_at = now()
          `
        }
        return [envVar]
      })
      if (updated) return res.json(updated)

      const insertName = name(patch.name)
      if (!hasSecret) reject(400, "missing secret value")
      const insertSecret = secret(patch.secret_value)
      const [created] = await sql.begin(async (tx) => {
        const [envVar] = await tx`
          INSERT INTO account_secret_env_vars (
            id,
            account_id,
            name,
            archived_at
          )
          VALUES (
            ${req.params.id}::uuid,
            ${req.account},
            ${insertName},
            ${archivedAt}::timestamptz
          )
          RETURNING id, account_id, name, archived_at, created_at, updated_at
        `
        await tx`
          INSERT INTO account_secret_env_var_values (env_var_id, secret_value)
          VALUES (${envVar.id}, ${insertSecret})
        `
        return [envVar]
      })
      res.json(created)
    } catch (e) {
      if (e?.code === "23505") e.status = 409
      next(e)
    }
  },
)

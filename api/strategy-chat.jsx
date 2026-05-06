import express from "express"
import postgres from "postgres"
import { authorize } from "./auth.jsx"
import { requiredModel, requiredString } from "./misc.jsx"

const sql = postgres(process.env.DATABASE_URL)

function text(response) {
  const parts = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
  if (!parts?.length) {
    throw new Error("OpenAI response missing assistant text")
  }
  return parts.join("\n\n").trim()
}

function usage(response) {
  const tokens = response.usage
  if (!tokens || typeof tokens !== "object") {
    throw new Error("OpenAI response missing usage")
  }
  const details =
    tokens.input_tokens_details &&
    typeof tokens.input_tokens_details === "object"
      ? tokens.input_tokens_details
      : {}
  const input = Number(tokens.input_tokens)
  const cached = Number(details.cached_tokens)
  const output = Number(tokens.output_tokens)
  const total = Number(tokens.total_tokens)
  if (
    !Number.isFinite(input) ||
    !Number.isFinite(cached) ||
    !Number.isFinite(output) ||
    !Number.isFinite(total)
  ) {
    throw new Error("OpenAI response has invalid usage")
  }
  return { input, cached, output, total }
}

async function answerMessage(row, message) {
  try {
    const messages = await sql`
      SELECT role, content FROM messages
      WHERE strategy_id = ${row.id}
      ORDER BY created_at ASC
    `
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI is not configured")
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: requiredModel(row.ai_model),
        instructions: [
          "You are Valgrid's strategy coding assistant.",
          "Help write and debug Python trading strategies.",
          "When code changes are useful, return complete Python snippets.",
        ].join(" "),
        input: [
          {
            role: "user",
            content: [
              `Strategy name: ${row.name}`,
              `Python:\n${row.code}`,
            ].join("\n\n"),
          },
          ...messages.map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content,
          })),
        ],
      }),
    })
    const payload = await response.json()
    if (!response.ok) {
      const error = payload.error && payload.error.message
      if (error) throw new Error(error)
      throw new Error("OpenAI request failed without error message")
    }
    const answer = text(payload)
    if (!answer) throw new Error("OpenAI returned no assistant text")
    const used = usage(payload)
    await sql`
      WITH assistant AS (
        INSERT INTO messages (strategy_id, role, content, status)
        VALUES (${row.id}, 'assistant', ${answer}, 'complete')
        RETURNING id
      ),
      completed AS (
        UPDATE messages
           SET status = 'complete'
         WHERE id = ${message.id}
           AND strategy_id = ${row.id}
         RETURNING id
      )
      INSERT INTO openai_usage (
        account_id,
        strategy_id,
        message_id,
        model,
        input_tokens,
        cached_input_tokens,
        output_tokens,
        total_tokens
      )
      SELECT
        ${row.account_id},
        ${row.id},
        ${message.id},
        ${row.ai_model},
        ${used.input},
        ${used.cached},
        ${used.output},
        ${used.total}
      FROM completed
    `
  } catch (e) {
    await sql`
      UPDATE messages
         SET status = 'failed'
       WHERE id = ${message.id}
         AND strategy_id = ${row.id}
         AND status = 'pending'
    `
    console.error("chat failed:", e)
  }
}

export const strategyChatRoutes = express.Router()

export async function failStaleChatMessages() {
  await sql`
    UPDATE messages
       SET status = 'failed'
     WHERE role = 'user'
       AND status = 'pending'
       AND created_at < now() - interval '2 minutes'
  `
}

strategyChatRoutes.patch("/messages/:id", authorize, async (req, res, next) => {
  try {
    const id = requiredString(req.params.id, "id")
    const strategy = requiredString(req.body?.strategy_id, "strategy_id")
    const content = requiredString(req.body?.content, "content")
    const [result] = await sql`
      WITH strategy AS (
        SELECT
          strategies.id,
          strategies.account_id,
          strategies.name,
          strategies.code,
          strategies.ai_model
        FROM strategies
        WHERE strategies.id = ${strategy}
          AND strategies.account_id = ${req.account}
          AND strategies.archived_at IS NULL
      ),
      message AS (
        INSERT INTO messages (id, strategy_id, role, content, status)
        SELECT ${id}::uuid, strategy.id, 'user', ${content}, 'pending'
        FROM strategy
        ON CONFLICT (id) DO UPDATE
          SET content = EXCLUDED.content
        WHERE messages.strategy_id = EXCLUDED.strategy_id
          AND messages.role = 'user'
        RETURNING messages.*, (xmax = 0) AS inserted
      )
      SELECT
        strategy.id,
        strategy.account_id,
        strategy.name,
        strategy.code,
        strategy.ai_model,
        message.id AS message_id,
        message.strategy_id,
        message.role,
        message.content,
        message.status,
        message.created_at,
        message.inserted
      FROM strategy
      LEFT JOIN message ON true
    `
    if (!result) return res.status(404).json({ error: "strategy not found" })
    if (!result.message_id) return res.status(409).json({ error: "message conflict" })
    const row = {
      id: result.id,
      account_id: result.account_id,
      name: result.name,
      code: result.code,
      ai_model: result.ai_model,
    }
    const message = {
      id: result.message_id,
      strategy_id: result.strategy_id,
      role: result.role,
      content: result.content,
      status: result.status,
      created_at: result.created_at,
    }
    if (result.inserted) {
      answerMessage(row, message).catch((e) =>
        console.error("chat dispatch failed:", e),
      )
    }
    res.json(message)
  } catch (e) {
    next(e)
  }
})

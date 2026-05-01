import postgres from "postgres"
import {
  network,
  optionalNumber,
  reject,
  requiredNumber,
  requiredString,
} from "./misc.jsx"

const sql = postgres(process.env.DATABASE_URL)
const sides = new Set(["buy", "sell"])
const kinds = new Set(["market", "limit"])

function side(value) {
  const direction = String(value).toLowerCase()
  if (sides.has(direction)) return direction
  reject(400, "invalid side")
}

function metadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    reject(400, "invalid metadata")
  }
  return value
}

function kind(value) {
  const kind = requiredString(value, "order_type")
  if (kinds.has(kind)) return kind
  reject(400, "invalid order_type")
}

function intent(value) {
  if (!value || typeof value !== "object") return null
  if (value.type !== "order") return null
  const order = {
    id: requiredString(value.id, "id"),
    side: side(value.side),
    instrument_type: requiredString(value.instrument_type, "instrument_type"),
    base_symbol: requiredString(value.base_symbol, "base_symbol").toUpperCase(),
    quote_symbol: requiredString(value.quote_symbol, "quote_symbol").toUpperCase(),
    order_type: kind(value.order_type),
    price: optionalNumber(value.price, "price"),
    trigger_price: optionalNumber(value.trigger_price, "trigger_price"),
    strike_price: optionalNumber(value.strike_price, "strike_price"),
    expiry: value.expiry === undefined ? null : requiredString(value.expiry, "expiry"),
    quantity: optionalNumber(value.quantity, "quantity"),
    quote_quantity: optionalNumber(value.quote_quantity, "quote_quantity"),
    metadata: metadata(value.metadata),
  }
  if (order.quantity === null && order.quote_quantity === null) {
    reject(400, "missing quantity")
  }
  if (order.quantity !== null && order.quantity <= 0) {
    reject(400, "invalid quantity")
  }
  if (order.quote_quantity !== null && order.quote_quantity <= 0) {
    reject(400, "invalid quote_quantity")
  }
  if (order.price !== null && order.price < 0) {
    reject(400, "invalid price")
  }
  return order
}

async function order(strategy, runner, event) {
  const order = intent(event)
  if (!order) return false
  await sql`
    INSERT INTO strategy_orders (
      id,
      strategy_id,
      account_id,
      strategy_wallet_id,
      wallet_address,
      runner_id,
      blockchain_network,
      side,
      instrument_type,
      base_symbol,
      quote_symbol,
      order_type,
      price,
      trigger_price,
      strike_price,
      expiry,
      quantity,
      quote_quantity,
      metadata,
      status,
      tx_signature,
      created_at
    )
    VALUES (
      ${order.id}::uuid,
      ${strategy.id},
      ${strategy.account_id},
      ${strategy.strategy_wallet_id},
      ${strategy.strategy_wallet_address},
      ${runner},
      ${network(strategy.blockchain_network)},
      ${order.side},
      ${order.instrument_type},
      ${order.base_symbol},
      ${order.quote_symbol},
      ${order.order_type},
      ${order.price},
      ${order.trigger_price},
      ${order.strike_price},
      ${order.expiry},
      ${order.quantity},
      ${order.quote_quantity},
      ${sql.json(order.metadata)},
      'intent',
      NULL,
      now()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      side = EXCLUDED.side,
      instrument_type = EXCLUDED.instrument_type,
      base_symbol = EXCLUDED.base_symbol,
      quote_symbol = EXCLUDED.quote_symbol,
      order_type = EXCLUDED.order_type,
      price = EXCLUDED.price,
      trigger_price = EXCLUDED.trigger_price,
      strike_price = EXCLUDED.strike_price,
      expiry = EXCLUDED.expiry,
      quantity = EXCLUDED.quantity,
      quote_quantity = EXCLUDED.quote_quantity,
      metadata = EXCLUDED.metadata
    WHERE strategy_orders.strategy_id = EXCLUDED.strategy_id
      AND strategy_orders.account_id = EXCLUDED.account_id
  `
  return true
}

export async function record(strategy, runner, trade, db = sql) {
  const fact = observed(trade)
  await db`
    INSERT INTO strategy_trades (
      id,
      order_id,
      strategy_id,
      account_id,
      strategy_wallet_id,
      wallet_address,
      runner_id,
      blockchain_network,
      side,
      instrument_type,
      base_symbol,
      quote_symbol,
      price,
      strike_price,
      expiry,
      quantity,
      quote_quantity,
      fee_quote,
      realized_pnl_quote,
      metadata,
      observation_source,
      observed_id,
      tx_signature,
      executed_at
    )
    VALUES (
      ${fact.id}::uuid,
      ${fact.order_id}::uuid,
      ${strategy.id},
      ${strategy.account_id},
      ${strategy.strategy_wallet_id},
      ${strategy.strategy_wallet_address},
      ${runner},
      ${network(strategy.blockchain_network)},
      ${fact.side},
      ${fact.instrument_type},
      ${fact.base_symbol},
      ${fact.quote_symbol},
      ${fact.price},
      ${fact.strike_price},
      ${fact.expiry},
      ${fact.quantity},
      ${fact.quote_quantity},
      ${fact.fee_quote},
      ${fact.realized_pnl_quote},
      ${sql.json(fact.metadata)},
      ${fact.observation_source},
      ${fact.observed_id},
      ${fact.tx_signature},
      ${fact.executed_at}::timestamptz
    )
    ON CONFLICT (observation_source, observed_id)
    DO UPDATE SET
      order_id = EXCLUDED.order_id,
      runner_id = EXCLUDED.runner_id,
      blockchain_network = EXCLUDED.blockchain_network,
      side = EXCLUDED.side,
      instrument_type = EXCLUDED.instrument_type,
      base_symbol = EXCLUDED.base_symbol,
      quote_symbol = EXCLUDED.quote_symbol,
      price = EXCLUDED.price,
      strike_price = EXCLUDED.strike_price,
      expiry = EXCLUDED.expiry,
      quantity = EXCLUDED.quantity,
      quote_quantity = EXCLUDED.quote_quantity,
      fee_quote = EXCLUDED.fee_quote,
      realized_pnl_quote = EXCLUDED.realized_pnl_quote,
      metadata = EXCLUDED.metadata,
      tx_signature = EXCLUDED.tx_signature,
      executed_at = EXCLUDED.executed_at
    WHERE strategy_trades.strategy_id = EXCLUDED.strategy_id
      AND strategy_trades.account_id = EXCLUDED.account_id
      AND strategy_trades.strategy_wallet_id = EXCLUDED.strategy_wallet_id
  `
  return true
}

export async function attribute(tx, strategy, trade) {
  if (trade.order_id) {
    const [order] = await tx`
      SELECT id
      FROM strategy_orders
      WHERE id = ${trade.order_id}
        AND strategy_id = ${strategy.id}
        AND status = 'intent'
      LIMIT 1
    `
    if (!order) reject(400, "trade does not match order intent")
    return trade
  }
  if (!trade.tx_signature) return trade

  const [order] = await tx`
    SELECT id
    FROM strategy_orders
    WHERE strategy_id = ${strategy.id}
      AND status = 'intent'
    ORDER BY created_at ASC
    LIMIT 1
  `
  if (!order) return trade
  return { ...trade, order_id: order.id }
}

export async function observe(tx, trade) {
  if (!trade.order_id) return
  await tx`
    UPDATE strategy_orders
       SET status = 'observed',
           tx_signature = ${trade.tx_signature},
           observed_at = ${trade.executed_at}::timestamptz
     WHERE id = ${trade.order_id}
       AND status = 'intent'
  `
}

export function observed(value) {
  if (!value || typeof value !== "object") {
    reject(400, "invalid observed trade")
  }
  const source = requiredString(value.observation_source, "observation_source")
  const marker = requiredString(value.observed_id, "observed_id")
  const executed = requiredString(value.executed_at, "executed_at")
  const trade = {
    id: requiredString(value.id, "id"),
    order_id: value.order_id === undefined ? null : requiredString(value.order_id, "order_id"),
    side: side(value.side),
    instrument_type: requiredString(value.instrument_type, "instrument_type"),
    base_symbol: requiredString(value.base_symbol, "base_symbol").toUpperCase(),
    quote_symbol: requiredString(value.quote_symbol, "quote_symbol").toUpperCase(),
    price: requiredNumber(value.price, "price"),
    strike_price: optionalNumber(value.strike_price, "strike_price"),
    expiry: value.expiry === undefined ? null : requiredString(value.expiry, "expiry"),
    quantity: requiredNumber(value.quantity, "quantity"),
    quote_quantity: requiredNumber(value.quote_quantity, "quote_quantity"),
    fee_quote: requiredNumber(value.fee_quote, "fee_quote"),
    realized_pnl_quote: requiredNumber(value.realized_pnl_quote, "realized_pnl_quote"),
    metadata: metadata(value.metadata),
    observation_source: source,
    observed_id: marker,
    tx_signature:
      value.tx_signature === undefined
        ? null
        : requiredString(value.tx_signature, "tx_signature"),
    executed_at: executed,
  }
  if (trade.price <= 0) reject(400, "invalid price")
  if (trade.quantity <= 0) reject(400, "invalid quantity")
  if (trade.quote_quantity < 0) reject(400, "invalid quote_quantity")
  if (trade.fee_quote < 0) reject(400, "invalid fee_quote")
  return trade
}

export async function ingest(strategy, runner, prefix, line) {
  if (!line.startsWith(prefix)) return
  try {
    const event = JSON.parse(line.slice(prefix.length))
    if (await order(strategy, runner, event)) return
    console.warn("ignored runner event type:", event.type)
  } catch (e) {
    console.warn("invalid runner event:", e.message)
  }
}

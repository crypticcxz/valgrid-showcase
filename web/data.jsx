import { collect, updateFields } from "./collections"
import {
  nowIso,
  RUNTIME_RUNNING,
  RUNTIME_STARTING,
  RUNTIME_STOPPED,
} from "./misc"

export function accounts(accountId) {
  return collect({
    id: `accounts:${accountId}`,
    table: "accounts",
    where: `id = '${accountId}'`,
    patch: { path: "/api/account" },
  })
}

export function strategies(accountId) {
  return collect({
    id: `strategies:${accountId}`,
    table: "strategies",
    where: `account_id = '${accountId}'`,
    patch: { path: "/api/strategies" },
  })
}

export function runtime(store, strategy, desired, code) {
  updateFields(store, strategy.id, {
    ...(typeof code === "string" ? { code } : {}),
    desired_runtime: desired,
    actual_runtime:
      desired === RUNTIME_RUNNING ? RUNTIME_STARTING : RUNTIME_STOPPED,
    runtime_requested_at: nowIso(),
  })
}

export function createStrategy(store, accountId, model, network) {
  const id = crypto.randomUUID()
  store.insert({
    id,
    account_id: accountId,
    name: "New strategy",
    blockchain_network: network,
    tags: [],
    is_public: false,
    is_starred: false,
    code: "",
    ai_model: model,
    desired_runtime: RUNTIME_STOPPED,
    actual_runtime: RUNTIME_STOPPED,
  })
  return id
}

export function strategyCopy(strategy, accountId, suffix, options) {
  if (typeof options?.public !== "boolean") {
    throw new Error("strategyCopy requires explicit public option")
  }
  return {
    id: crypto.randomUUID(),
    account_id: accountId,
    name: `${strategy.name} ${suffix}`,
    blockchain_network: strategy.blockchain_network,
    tags: strategy.tags,
    is_public: options.public,
    is_starred: false,
    code: strategy.code,
    ai_model: strategy.ai_model,
    desired_runtime: RUNTIME_STOPPED,
    actual_runtime: RUNTIME_STOPPED,
  }
}

export function publicStrategy(id) {
  return collect({
    id: `public_strategy:${id}`,
    table: "strategies",
    where: `id = '${id}' AND is_public = true AND archived_at IS NULL`,
  })
}

export function trades(strategy) {
  return collect({
    id: `strategy_trades:${strategy}`,
    table: "strategy_trades",
    where: `strategy_id = '${strategy}'`,
  })
}

export function strategyWallets(strategy) {
  return collect({
    id: `strategy_wallets:${strategy}`,
    table: "strategy_wallets",
    where: `strategy_id = '${strategy}'`,
    patch: { path: "/api/strategy-wallets" },
  })
}

export function strategyWalletBalances(strategy) {
  return collect({
    id: `strategy_wallet_balances:${strategy}`,
    table: "strategy_wallet_balances",
    where: `strategy_id = '${strategy}'`,
  })
}

export function strategyWalletFundingRequests(strategy) {
  return collect({
    id: `strategy_wallet_funding_requests:${strategy}`,
    table: "strategy_wallet_funding_requests",
    where: `strategy_id = '${strategy}'`,
    patch: { path: "/api/strategy-wallet-funding-requests" },
  })
}

export function charts(strategy) {
  return collect({
    id: `strategy_charts:${strategy}`,
    table: "strategy_charts",
    where: `strategy_id = '${strategy}' AND archived_at IS NULL`,
    patch: { path: "/api/strategy-charts" },
  })
}

export function messages(strategy) {
  return collect({
    id: `messages:${strategy}`,
    table: "messages",
    where: `strategy_id = '${strategy}'`,
    patch: { path: "/api/messages" },
  })
}

export function wallet(accountId) {
  return collect({
    id: `wallets:${accountId}`,
    table: "wallets",
    where: `account_id = '${accountId}' AND archived_at IS NULL`,
    patch: { path: "/api/wallets" },
  })
}

export function walletBalances(accountId) {
  return collect({
    id: `wallet_balances:${accountId}`,
    table: "wallet_balances",
    where: `account_id = '${accountId}'`,
  })
}

export function accountEnvVars(accountId) {
  return collect({
    id: `account_secret_env_vars:${accountId}`,
    table: "account_secret_env_vars",
    where: `account_id = '${accountId}' AND archived_at IS NULL`,
    patch: { path: "/api/account-env-vars" },
  })
}

export function notifications(accountId) {
  return collect({
    id: `notifications:${accountId}`,
    table: "notifications",
    where: `account_id = '${accountId}'`,
    patch: { path: "/api/notifications" },
  })
}

export function strategyRuns(accountId) {
  return collect({
    id: `strategy_runs:${accountId}`,
    table: "strategy_runs",
    where: `account_id = '${accountId}'`,
  })
}

export function openaiUsage(accountId) {
  return collect({
    id: `openai_usage:${accountId}`,
    table: "openai_usage",
    where: `account_id = '${accountId}'`,
  })
}

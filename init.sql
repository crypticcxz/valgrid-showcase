CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub TEXT UNIQUE,
  tier TEXT NOT NULL,
  primary_wallet_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  address TEXT NOT NULL,
  chain TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  balance_refresh_requested_at TIMESTAMPTZ,
  balance_refresh_started_at TIMESTAMPTZ,
  balance_refresh_finished_at TIMESTAMPTZ,
  balance_refresh_error TEXT,
  archived_at TIMESTAMPTZ,
  UNIQUE (chain, address)
);

CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  network TEXT NOT NULL,
  lamports BIGINT,
  error TEXT,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet_id, network),
  CHECK (network IN ('devnet', 'mainnet')),
  CHECK (lamports IS NULL OR lamports >= 0)
);

CREATE TABLE IF NOT EXISTS account_secret_env_vars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  name TEXT NOT NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (name ~ '^[A-Z_][A-Z0-9_]*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS account_secret_env_vars_active_name_idx
  ON account_secret_env_vars (account_id, name)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS account_secret_env_var_values (
  env_var_id UUID PRIMARY KEY REFERENCES account_secret_env_vars(id) ON DELETE CASCADE,
  secret_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  name TEXT NOT NULL,
  blockchain_network TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  is_public BOOLEAN NOT NULL,
  is_starred BOOLEAN NOT NULL,
  code TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  desired_runtime TEXT NOT NULL,
  actual_runtime TEXT NOT NULL DEFAULT 'stopped',
  runtime_runner_id TEXT,
  runtime_requested_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (blockchain_network IN ('devnet', 'mainnet')),
  CHECK (desired_runtime IN ('running', 'stopped')),
  CHECK (actual_runtime IN ('starting', 'running', 'stopped', 'crashed'))
);

CREATE TABLE IF NOT EXISTS strategy_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL UNIQUE REFERENCES strategies(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  chain TEXT NOT NULL,
  address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  balance_refresh_requested_at TIMESTAMPTZ,
  balance_refresh_started_at TIMESTAMPTZ,
  balance_refresh_finished_at TIMESTAMPTZ,
  balance_refresh_error TEXT,
  CHECK (chain = 'solana')
);

CREATE TABLE IF NOT EXISTS strategy_wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_wallet_id UUID NOT NULL REFERENCES strategy_wallets(id),
  strategy_id UUID NOT NULL REFERENCES strategies(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  network TEXT NOT NULL,
  lamports BIGINT,
  error TEXT,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (strategy_wallet_id, network),
  CHECK (network IN ('devnet', 'mainnet')),
  CHECK (lamports IS NULL OR lamports >= 0)
);

CREATE TABLE IF NOT EXISTS strategy_wallet_funding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_wallet_id UUID NOT NULL REFERENCES strategy_wallets(id),
  strategy_id UUID NOT NULL REFERENCES strategies(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  network TEXT NOT NULL,
  amount_sol NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  signature TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CHECK (network = 'devnet'),
  CHECK (amount_sol > 0 AND amount_sol <= 2),
  CHECK (status IN ('pending', 'processing', 'complete', 'failed'))
);

CREATE TABLE IF NOT EXISTS strategy_wallet_observers (
  strategy_wallet_id UUID NOT NULL REFERENCES strategy_wallets(id),
  observation_source TEXT NOT NULL,
  cursor TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (strategy_wallet_id, observation_source),
  CHECK (observation_source <> ''),
  CHECK (cursor <> '')
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS strategy_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES strategies(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  title TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  network TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CHECK (contract_address <> ''),
  CHECK (network IN ('solana'))
);

CREATE TABLE IF NOT EXISTS strategy_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES strategies(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  runner_id TEXT NOT NULL,
  exit_code INTEGER,
  cpu_seconds NUMERIC NOT NULL,
  wall_seconds NUMERIC NOT NULL,
  cpu_limit NUMERIC NOT NULL,
  memory_limit_mb INTEGER NOT NULL,
  peak_memory_bytes BIGINT NOT NULL,
  cost_cents NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS strategy_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES strategies(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  strategy_wallet_id UUID NOT NULL REFERENCES strategy_wallets(id),
  wallet_address TEXT NOT NULL,
  runner_id TEXT,
  blockchain_network TEXT NOT NULL,
  side TEXT NOT NULL,
  instrument_type TEXT NOT NULL,
  base_symbol TEXT NOT NULL,
  quote_symbol TEXT NOT NULL,
  order_type TEXT NOT NULL,
  price NUMERIC,
  trigger_price NUMERIC,
  strike_price NUMERIC,
  expiry TEXT,
  quantity NUMERIC,
  quote_quantity NUMERIC,
  metadata JSONB NOT NULL,
  status TEXT NOT NULL,
  tx_signature TEXT,
  observed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (blockchain_network IN ('devnet', 'mainnet')),
  CHECK (side IN ('buy', 'sell')),
  CHECK (wallet_address <> ''),
  CHECK (instrument_type <> ''),
  CHECK (base_symbol <> ''),
  CHECK (quote_symbol <> ''),
  CHECK (order_type IN ('market', 'limit')),
  CHECK (status IN ('intent', 'observed')),
  CHECK (
    (quantity IS NOT NULL AND quantity > 0) OR
    (quote_quantity IS NOT NULL AND quote_quantity > 0)
  ),
  CHECK (price IS NULL OR price >= 0),
  CHECK (status <> 'observed' OR observed_at IS NOT NULL),
  CHECK (status <> 'observed' OR (tx_signature IS NOT NULL AND tx_signature <> ''))
);

CREATE TABLE IF NOT EXISTS strategy_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES strategy_orders(id),
  strategy_id UUID NOT NULL REFERENCES strategies(id),
  account_id UUID NOT NULL REFERENCES accounts(id),
  strategy_wallet_id UUID NOT NULL REFERENCES strategy_wallets(id),
  wallet_address TEXT NOT NULL,
  runner_id TEXT,
  blockchain_network TEXT NOT NULL,
  side TEXT NOT NULL,
  instrument_type TEXT NOT NULL,
  base_symbol TEXT NOT NULL,
  quote_symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  strike_price NUMERIC,
  expiry TEXT,
  quantity NUMERIC NOT NULL,
  quote_quantity NUMERIC NOT NULL,
  fee_quote NUMERIC NOT NULL,
  realized_pnl_quote NUMERIC NOT NULL,
  metadata JSONB NOT NULL,
  observation_source TEXT NOT NULL,
  observed_id TEXT NOT NULL,
  tx_signature TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (blockchain_network IN ('devnet', 'mainnet')),
  CHECK (side IN ('buy', 'sell')),
  CHECK (wallet_address <> ''),
  CHECK (instrument_type <> ''),
  CHECK (base_symbol <> ''),
  CHECK (quote_symbol <> ''),
  CHECK (observation_source <> ''),
  CHECK (observed_id <> ''),
  CHECK (price > 0),
  CHECK (quantity > 0),
  CHECK (quote_quantity >= 0),
  CHECK (fee_quote >= 0),
  CHECK (tx_signature IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES strategies(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status IN ('pending', 'complete', 'failed'))
);

CREATE TABLE IF NOT EXISTS openai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  strategy_id UUID NOT NULL REFERENCES strategies(id),
  message_id UUID REFERENCES messages(id),
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  cached_input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS strategy_charts_updated_at ON strategy_charts;
CREATE TRIGGER strategy_charts_updated_at
BEFORE UPDATE ON strategy_charts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS strategy_wallet_observers_updated_at
  ON strategy_wallet_observers;
CREATE TRIGGER strategy_wallet_observers_updated_at
BEFORE UPDATE ON strategy_wallet_observers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS wallets_account_id_idx ON wallets (account_id);
CREATE INDEX IF NOT EXISTS wallet_balances_account_id_idx
  ON wallet_balances (account_id, refreshed_at);
CREATE INDEX IF NOT EXISTS strategy_wallets_account_id_idx ON strategy_wallets (account_id);
CREATE INDEX IF NOT EXISTS strategy_wallet_balances_account_id_idx
  ON strategy_wallet_balances (account_id, refreshed_at);
CREATE INDEX IF NOT EXISTS strategy_wallet_observers_source_idx
  ON strategy_wallet_observers (observation_source, updated_at);
CREATE INDEX IF NOT EXISTS strategies_account_id_idx ON strategies (account_id);
CREATE INDEX IF NOT EXISTS messages_strategy_id_idx ON messages (strategy_id);
CREATE INDEX IF NOT EXISTS openai_usage_account_id_idx ON openai_usage (account_id, created_at);
CREATE INDEX IF NOT EXISTS notifications_account_id_idx ON notifications (account_id);
CREATE INDEX IF NOT EXISTS strategy_charts_strategy_id_idx
  ON strategy_charts (strategy_id, created_at)
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS strategy_wallet_funding_requests_strategy_id_idx
  ON strategy_wallet_funding_requests (strategy_id, created_at);
CREATE INDEX IF NOT EXISTS strategy_runs_strategy_id_idx ON strategy_runs (strategy_id, created_at);
CREATE INDEX IF NOT EXISTS strategy_runs_account_id_idx ON strategy_runs (account_id, created_at);
CREATE INDEX IF NOT EXISTS strategy_orders_strategy_id_idx ON strategy_orders (strategy_id, created_at);
CREATE INDEX IF NOT EXISTS strategy_orders_account_id_idx ON strategy_orders (account_id, created_at);
CREATE INDEX IF NOT EXISTS strategy_orders_tx_signature_idx ON strategy_orders (tx_signature);
CREATE INDEX IF NOT EXISTS strategy_trades_strategy_id_idx ON strategy_trades (strategy_id, executed_at);
CREATE INDEX IF NOT EXISTS strategy_trades_account_id_idx ON strategy_trades (account_id, executed_at);
CREATE UNIQUE INDEX IF NOT EXISTS strategy_trades_observation_idx
  ON strategy_trades (observation_source, observed_id);

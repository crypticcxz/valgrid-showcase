const TEMPLATE_DEFS = [
  {
    id: "event",
    name: "Order intent",
    summary: "Emits a structured SOL order intent.",
    chart: {
      title: "SOL/USDT",
      contract_address: "BINANCE:SOLUSDT",
    },
    code: `import json
import os
from uuid import uuid4

prefix = os.environ["VALGRID_EVENT_PREFIX"]
wallet = os.environ["VALGRID_STRATEGY_WALLET_ADDRESS"]

event = {
    "id": str(uuid4()),
    "type": "order",
    "side": "buy",
    "instrument_type": "spot",
    "base_symbol": "SOL",
    "quote_symbol": "USDC",
    "order_type": "market",
    "quote_quantity": 37.5,
    "metadata": {"source": "template", "wallet": wallet},
}

print(prefix + json.dumps(event), flush=True)
`,
  },
  {
    id: "grid-bot",
    name: "SOL grid bot",
    summary: "Places layered SOL buy and sell limits.",
    chart: {
      title: "SOL/USDT",
      contract_address: "BINANCE:SOLUSDT",
    },
    code: `import json
import os
from uuid import uuid4

prefix = os.environ["VALGRID_EVENT_PREFIX"]
wallet = os.environ["VALGRID_STRATEGY_WALLET_ADDRESS"]

center = 150.0
step = 2.5
levels = 3
quote_size = 25.0
base_size = 0.15

for level in range(1, levels + 1):
    buy_price = round(center - step * level, 2)
    sell_price = round(center + step * level, 2)

    buy = {
        "id": str(uuid4()),
        "type": "order",
        "side": "buy",
        "instrument_type": "spot",
        "base_symbol": "SOL",
        "quote_symbol": "USDC",
        "order_type": "limit",
        "price": buy_price,
        "quote_quantity": quote_size,
        "metadata": {
            "strategy": "grid",
            "level": level,
            "wallet": wallet,
        },
    }
    print(prefix + json.dumps(buy), flush=True)

    sell = {
        "id": str(uuid4()),
        "type": "order",
        "side": "sell",
        "instrument_type": "spot",
        "base_symbol": "SOL",
        "quote_symbol": "USDC",
        "order_type": "limit",
        "price": sell_price,
        "quantity": base_size,
        "metadata": {
            "strategy": "grid",
            "level": level,
            "wallet": wallet,
        },
    }
    print(prefix + json.dumps(sell), flush=True)

print("grid ready", flush=True)
`,
  },
  {
    id: "dca-bot",
    name: "SOL DCA",
    summary: "Emits a fixed-size SOL market buy.",
    chart: {
      title: "SOL/USDT",
      contract_address: "BINANCE:SOLUSDT",
    },
    code: `import json
import os
from uuid import uuid4

prefix = os.environ["VALGRID_EVENT_PREFIX"]
wallet = os.environ["VALGRID_STRATEGY_WALLET_ADDRESS"]

event = {
    "id": str(uuid4()),
    "type": "order",
    "side": "buy",
    "instrument_type": "spot",
    "base_symbol": "SOL",
    "quote_symbol": "USDC",
    "order_type": "market",
    "quote_quantity": 20.0,
    "metadata": {
        "strategy": "dca",
        "wallet": wallet,
    },
}

print(prefix + json.dumps(event), flush=True)
print("dca order emitted", flush=True)
`,
  },
  {
    id: "breakout-bot",
    name: "Breakout bot",
    summary: "Emits a SOL breakout buy intent.",
    chart: {
      title: "SOL/USDT",
      contract_address: "BINANCE:SOLUSDT",
    },
    code: `import json
import os
from uuid import uuid4

prefix = os.environ["VALGRID_EVENT_PREFIX"]
wallet = os.environ["VALGRID_STRATEGY_WALLET_ADDRESS"]

event = {
    "id": str(uuid4()),
    "type": "order",
    "side": "buy",
    "instrument_type": "spot",
    "base_symbol": "SOL",
    "quote_symbol": "USDC",
    "order_type": "market",
    "trigger_price": 165.0,
    "quote_quantity": 50.0,
    "metadata": {
        "strategy": "breakout",
        "wallet": wallet,
    },
}

print(prefix + json.dumps(event), flush=True)
print("breakout trigger armed", flush=True)
`,
  },
  {
    id: "mean-reversion",
    name: "Mean reversion",
    summary: "Places buy-low and sell-high limits.",
    chart: {
      title: "SOL/USDT",
      contract_address: "BINANCE:SOLUSDT",
    },
    code: `import json
import os
from uuid import uuid4

prefix = os.environ["VALGRID_EVENT_PREFIX"]
wallet = os.environ["VALGRID_STRATEGY_WALLET_ADDRESS"]

events = [
    {
        "id": str(uuid4()),
        "type": "order",
        "side": "buy",
        "instrument_type": "spot",
        "base_symbol": "SOL",
        "quote_symbol": "USDC",
        "order_type": "limit",
        "price": 142.5,
        "quote_quantity": 40.0,
        "metadata": {"strategy": "mean-reversion", "wallet": wallet},
    },
    {
        "id": str(uuid4()),
        "type": "order",
        "side": "sell",
        "instrument_type": "spot",
        "base_symbol": "SOL",
        "quote_symbol": "USDC",
        "order_type": "limit",
        "price": 157.5,
        "quantity": 0.25,
        "metadata": {"strategy": "mean-reversion", "wallet": wallet},
    },
]

for event in events:
    print(prefix + json.dumps(event), flush=True)

print("mean reversion orders emitted", flush=True)
`,
  },
  {
    id: "momentum-bot",
    name: "Momentum bot",
    summary: "Emits a larger buy on trend confirmation.",
    chart: {
      title: "SOL/USDT",
      contract_address: "BINANCE:SOLUSDT",
    },
    code: `import json
import os
from uuid import uuid4

prefix = os.environ["VALGRID_EVENT_PREFIX"]
wallet = os.environ["VALGRID_STRATEGY_WALLET_ADDRESS"]

event = {
    "id": str(uuid4()),
    "type": "order",
    "side": "buy",
    "instrument_type": "spot",
    "base_symbol": "SOL",
    "quote_symbol": "USDC",
    "order_type": "market",
    "quote_quantity": 75.0,
    "metadata": {
        "strategy": "momentum",
        "signal": "trend-confirmed",
        "wallet": wallet,
    },
}

print(prefix + json.dumps(event), flush=True)
print("momentum entry emitted", flush=True)
`,
  },
  {
    id: "take-profit-ladder",
    name: "Take-profit ladder",
    summary: "Places staged SOL sell limits.",
    chart: {
      title: "SOL/USDT",
      contract_address: "BINANCE:SOLUSDT",
    },
    code: `import json
import os
from uuid import uuid4

prefix = os.environ["VALGRID_EVENT_PREFIX"]
wallet = os.environ["VALGRID_STRATEGY_WALLET_ADDRESS"]

targets = [
    (162.0, 0.10),
    (168.0, 0.10),
    (175.0, 0.15),
]

for index, (price, quantity) in enumerate(targets, start=1):
    event = {
        "id": str(uuid4()),
        "type": "order",
        "side": "sell",
        "instrument_type": "spot",
        "base_symbol": "SOL",
        "quote_symbol": "USDC",
        "order_type": "limit",
        "price": price,
        "quantity": quantity,
        "metadata": {
            "strategy": "take-profit-ladder",
            "target": index,
            "wallet": wallet,
        },
    }
    print(prefix + json.dumps(event), flush=True)

print("take-profit ladder emitted", flush=True)
`,
  },
  {
    id: "http-fetch",
    name: "HTTP fetch",
    summary: "Calls an external HTTP endpoint.",
    chart: {
      title: "GitHub",
      contract_address: "NASDAQ:MSFT",
    },
    code: `from urllib.request import urlopen

with urlopen("https://api.github.com", timeout=10) as response:
    print(response.status)
    print(response.read(200).decode("utf-8"))
`,
  },
]

function templateStrategy(definition) {
  return {
    ...definition,
    apply({ strategy, strategyStore, chartStore }) {
      strategyStore.update(strategy.id, (draft) => {
        draft.name = definition.name
        draft.code = definition.code
      })

      const chartId = crypto.randomUUID()
      chartStore.insert({
        id: chartId,
        strategy_id: strategy.id,
        account_id: strategy.account_id,
        title: definition.chart.title,
        contract_address: definition.chart.contract_address,
      })
    },
  }
}

export const TEMPLATES = TEMPLATE_DEFS.map(templateStrategy)

"""
Example Solana trading bot template.
Replace this with your own logic.
"""

import os
import time

RPC_URL = os.environ.get("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")

def main():
    print(f"[valgrid] bot started, rpc={RPC_URL}")

    while True:
        # Your trading logic goes here
        print("[valgrid] tick")
        time.sleep(10)

if __name__ == "__main__":
    main()

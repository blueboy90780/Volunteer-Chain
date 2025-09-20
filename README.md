⸻

📘 Volunteer Chain — Soulbound Token (SBT) System

This project implements a Soulbound Token (SBT) system for tracking volunteer contributions, using an on-chain ERC-721 contract (non-transferable) and an off-chain service for EIP-712 voucher signing & verification.

⸻

🚀 Features

    •	✅ Verify authenticity of vouchers (signature, replay protection, optional business rules).
    •	✅ Mint & issue SBT: permanently assign to student wallet, link to IPFS metadata.
    •	✅ Organizer role management: only whitelisted organizers can issue vouchers.
    •	✅ Event tracking: prevent duplicate claims for the same event.
    •	✅ Public verification interface: query SBTs held by a student.

⸻

📦 Prerequisites

    •	Python 3.9+
    •	Node.js 16+ (for frontend dApp, optional)
    •	Brownie & Ganache/Anvil or Sepolia RPC
    •	Access to Sepolia testnet ETH

⸻

⚙️ Setup

1. Clone repo & install Python dependencies

# Clone project

```
git clone https://github.com/<your-org>/Volunteer-Chain.git
cd Volunteer-Chain/"Smart Contract and SBT Token"
```

# Setup Python venv

```
python3 -m venv .venv
source .venv/bin/activate
```

# Upgrade pip & install dependencies

```
pip install --upgrade pip
pip install -r offchain/requirements.txt
```

Windows (PowerShell) equivalents:

```powershell
# Create and activate venv
py -3 -m venv .venv  # or: python -m venv .venv
 .\.venv\Scripts\Activate.ps1

# Upgrade pip & install dependencies
python -m pip install --upgrade pip
pip install -r offchain/requirements.txt
```

⸻

2. Configure environment

Copy .env.example to .env and fill in values:

```
cp .env.example .env
nano .env
```

Example values:

```
RPC_URL=https://rpc.sepolia.org
CHAIN_ID=11155111
CONTRACT_ADDRESS=0x<DEPLOYED_CONTRACT>
PRIVATE_KEY=0x<ORGANIZER_PRIVATE_KEY>   # DO NOT use production key
```

Windows (PowerShell) equivalents:

```powershell
Copy-Item .env.example .env
notepad .env  # or: code .env
```

Note (Windows): If running Activate.ps1 is blocked, allow local scripts once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

⸻

3. Compile & deploy contract

```
cd Volunteer-Chain/"Smart Contract and SBT Token"
brownie compile
brownie run scripts/deploy.py --network sepolia-public
```

Output will show:

```
SBT deployed at: 0x...
```

Copy this contract address into your .env.

⸻

4. Run off-chain API

```
cd Volunteer-Chain/"Smart Contract and SBT Token/offchain"
source ../.venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Health check:

```
curl -s http://127.0.0.1:8000/health
```

Windows (PowerShell) equivalents:

```powershell
cd "Volunteer-Chain/Smart Contract and SBT Token/offchain"
..\.venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

⸻

🧪 Test Flow

1. Sign voucher (off-chain)

```
STUDENT=0xF26CC4C12dbBb207423bBd479a814b816a562883

EVENT=EVT-README-001

ROLE=Helper

HOURS=4

curl -s -X POST http://127.0.0.1:8000/sign \
  -H "Content-Type: application/json" \
  -d "{\"student\":\"$STUDENT\",\"eventId\":\"$EVENT\",\"role\":\"$ROLE\",\"hours\":$HOURS}"
```

This returns:

```
{
  "signature": "0x...",
  "message": {
    "student": "0xF26C...",
    "eventId": "EVT-README-001",
    "role": "Helper",
    "hours": 4,
    "nonce": "0x...",
    "expiresAt": 1758275147
  }
}
```

Windows (PowerShell) equivalent:

```powershell
$STUDENT = "0xF26CC4C12dbBb207423bBd479a814b816a562883"
$EVENT   = "EVT-README-001"
$ROLE    = "Helper"
$HOURS   = 4

$body = @{ student = $STUDENT; eventId = $EVENT; role = $ROLE; hours = $HOURS } | ConvertTo-Json

Invoke-RestMethod -Method POST \
  -Uri "http://127.0.0.1:8000/sign" \
  -ContentType "application/json" \
  -Body $body
```

⸻

2. Issue SBT (on-chain)

Take the signature, nonce, and expiresAt from the previous step:

```
curl -s -X POST http://127.0.0.1:8000/issue_signed \
  -H "Content-Type: application/json" \
  -d '{
    "signature":"0x...",
    "message":{
      "student":"0xF26C...",
      "eventId":"EVT-README-001",
      "role":"Helper",
      "hours":4,
      "nonce":"0x...",
      "expiresAt":1758275147
    }
  }'

```

If successful, the API responds with a transaction hash (txHash). You can verify it on Sepolia Etherscan.

Windows (PowerShell) equivalent:

```powershell
$payload = @{
  signature = "0x...";
  message = @{
    student = "0xF26C..."; eventId = "EVT-README-001"; role = "Helper"; hours = 4; nonce = "0x..."; expiresAt = 1758275147
  }
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Method POST \
  -Uri "http://127.0.0.1:8000/issue_signed" \
  -ContentType "application/json" \
  -Body $payload
```

⸻

3. On-chain verification helpers

```
cd Volunteer-Chain/"Smart Contract and SBT Token/offchain"
```

# Check if event was claimed

```
python3 sbt_tools.py event_claimed EVT-README-001 0xF26CC4C12dbBb207423bBd479a814b816a562883
```

# Check if nonce was used

```
python3 sbt_tools.py used_nonce 0x<NONCE>
```

Windows (PowerShell) equivalents:

```powershell
cd "Volunteer-Chain/Smart Contract and SBT Token/offchain"

# Check if event was claimed
python sbt_tools.py event_claimed EVT-README-001 0xF26CC4C12dbBb207423bBd479a814b816a562883

# Check if nonce was used
python sbt_tools.py used_nonce 0x<NONCE>
```

⸻

🔒 Security Notes

• Never commit .env or private keys to Git.
• Always use .env.example for templates.
• Nonce must be unique; expired signatures are rejected.
• On Windows, you can follow the PowerShell commands above, or use Git Bash/WSL to run the bash snippets. Note: `source` is a bash built‑in; in PowerShell use `.<\\.venv\\Scripts\\Activate.ps1>` or `..\\.venv\\Scripts\\Activate.ps1` instead.

⸻

📚 References

    •	Ethereum Brownie: https://eth-brownie.readthedocs.io
    •	FastAPI: https://fastapi.tiangolo.com
    •	EIP-712: https://eips.ethereum.org/EIPS/eip-712

⸻

🐳 Docker quickstart

1. Copy `.env.example` to `.env` and fill in values (at least `PRIVATE_KEY`, optional `PINATA_JWT`).

2. Build and start the stack (PowerShell):

```powershell
docker compose up --build
```

Services:

- chain: Local Ganache JSON-RPC on http://localhost:8545
- contracts: Builds Brownie and deploys `SBT.sol` to the local chain (check logs for address)
- offchain: Runs the Bun demo that interacts with IPFS and generates QR codes (outputs mounted to `Cryptographic Verification and IPFS/outputs`)
- frontend: Static SPA served at http://localhost:3000

Notes:

- The deployed contract address is printed in the `contracts` container logs. If you want the frontend/offchain to target a fixed address, set `CONTRACT_ADDRESS` in `.env` before starting.
- To rebuild after code changes, re-run with `--build`.

# Volunteer Chain

## Smart Contract + Off-Chain Service (EIP-712 Flow)

This part of the project includes the Solidity SBT smart contract and a Python FastAPI off-chain service that supports:

- ✅ Organizer role management (whitelisting)
- ✅ EIP-712 signature flow for voucher issuance
- ✅ On-chain SBT minting (non-transferable ERC-721)
- ✅ Event ID & hours tracking (prevents double-claims)
- ✅ Public verification interface for employers/institutions
- ✅ IPFS metadata integration

---

## Prerequisites

- Python 3.9+
- Node.js + npm (for frontend dApp integration)
- Brownie (Ethereum smart contract development framework)
- Sepolia Testnet ETH (via faucet)
- Infura / PublicNode RPC URL

---

## Setup

1) Clone & venbash
cd ~/Volunteer-Chain
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install -r "Smart Contract and SBT Token/offchain/requirements.txt"

2) Environment
RPC_URL=https://rpc.sepolia.org
CHAIN_ID=11155111
CONTRACT_ADDRESS=0x2f31220E16662A5658201c900d2d597Fdaa56779
PRIVATE_KEY=0x<ORGANIZER_PRIVATE_KEY>   # do NOT use a production key

3) Compile & deploy
cd "Smart Contract and SBT Token"
brownie compile
brownie run scripts/deploy.py --network sepolia-public
# => SBT deployed at: 0x....

4) Off-chain API
cd "Smart Contract and SBT Token/offchain"
source ../.venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

// Health check
curl -s http://127.0.0.1:8000/health

---

## Run the demo

1) Sign a voucher (EIP-712)
curl -s -X POST http://127.0.0.1:8000/sign \
  -H "Content-Type: application/json" \
  -d '{
    "student":"0xF26CC4C12dbBb207423bBd479a814b816a562883",
    "eventId":"EVT-001",
    "role":"Helper",
    "hours":4
  }'

2) Issue (mint on-chain)
curl -s -X POST http://127.0.0.1:8000/issue_signed \
  -H "Content-Type: application/json" \
  -d '{
    "signature":"0x<signature_from_sign>",
    "message":{
      "student":"0xF26CC4C12dbBb207423bBd479a814b816a562883",
      "eventId":"EVT-001",
      "role":"Helper",
      "hours":4,
      "nonce":"0x<nonce_from_sign>",
      "expiresAt":<expires_from_sign>
    }
  }'

* What it does: 
	•	Pins (optional) event metadata to IPFS (CID) → tokenURI holds the IPFS link.
	•	Creates and signs EIP-712 voucher off-chain (organizer).
	•	Verifies domain & rules off-chain, enforces invariants on-chain:
	•	organizer is whitelisted
	•	usedNonces[nonce] == false
	•	eventClaimed[eventId][student] == false
	•	hours ≤ maxHoursPerEvent[eventId] (0 = unlimited)
	•	Mints a non-transferable ERC-721 to the student wallet.

* Artifacts:
	•	Smart Contract and SBT Token/build/contracts/SBT.json — ABI
	•	(Nếu có QR) outputs/voucher-<eventId>.png — compact QR
	•	outputs/voucher-<eventId>.json — signed voucher

 ---

 ## Integrating with the smart contract
 
	•	Contract: SBT @ 0x2f31220E16662A5658201c900d2d597Fdaa56779 (Sepolia)
	•	Public methods:
	    •	addOrganizer(address) / removeOrganizer(address) / isOrganizer(address)
	    •	setMaxHoursForEvent(bytes32 eventId, uint256 maxHours)
	    •	mintSBT(address student, string uri, bytes32 nonce, bytes32 eventId, uint256 contributedHours, address organizer)
	    •	tokenURI(uint256 tokenId)
	•	Non-transferable: transfers revert (soulbound)

---

## Security note

	•	Never commit .env or private keys; use .env.example for templates.
	•	Keep EIP-712 domain consistent (name/version/chainId/contract).
	•	Use fresh nonce for each voucher; expire quickly.
	•	Prefer HTTPS when fetching voucher JSON; QR should carry short pointers (CID/URL), not full secrets.

---








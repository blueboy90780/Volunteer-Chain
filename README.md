# Volunteer Chain

# VolunteerChain Off-Chain Prototype

This folder includes a TypeScript prototype for the Cryptographic Verification features:

- Off-chain metadata on IPFS (Pinata)
- Voucher creation and EIP-712 signing
- QR code generation with compact payload
- Mock on-chain verification

## Prerequisites

- Node.js 18+
- Pinata account and JWT (recommended) or API key/secret

## Setup

1. Copy `.env.example` to `.env` and fill in values:

```
PINATA_JWT=eyJhbGciOiJ...  # preferred
# or
PINATA_API_KEY=...
PINATA_API_SECRET=...

# Your organizer signing key (for local demo; DO NOT use production key)
ORGANIZER_PRIVATE_KEY=0x...
```

2. Install dependencies:

```pwsh
npm install
```

## Run the demo

```pwsh
npm run demo
```

What it does:

- Pins sample event metadata JSON to IPFS using Pinata
- Creates and signs a voucher (EIP-712 typed data)
- Verifies signature locally and mocks an on-chain verify result
- Generates a QR code PNG under `outputs/`

Artifacts:

- `outputs/voucher-<eventId>.png` — QR code image
- `outputs/voucher-<eventId>.json` — Signed voucher for inspection

## Integrating with the smart contract

- Replace the default EIP-712 domain in `src/lib/eip712.ts` with your deployed contract address and chainId.
- Call your contract function `mintWithSignature(student, ipfsCID, signature)` after scanning the QR and fetching the full voucher JSON.

Security notes:

- Never commit real private keys. Use environment variables and secrets managers.
- Prefer short QR payloads (URL pointer), fetch voucher JSON securely (HTTPS), then verify on-chain.

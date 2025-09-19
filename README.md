# Volunteer-Chain — Soulbound Token (SBT) + Offchain EIP-712

This folder documents the **SBT contract** and the **offchain service** (FastAPI) that issues verifiable volunteer credentials via **EIP-712 vouchers** and mints **non-transferable ERC-721** (Soulbound) on **Sepolia** or **local dev chain**.

> Owner/deployer auto-becomes the first organizer. Organizers can whitelist additional organizers.

---

## ✨ What’s implemented

On-chain (SBT.sol)  
- Non-transferable ERC-721 (soulbound)  
- Organizer whitelist: `addOrganizer/removeOrganizer/isOrganizer`  
- Anti-replay: `usedNonces[bytes32]`  
- Event attendance tracking: `eventClaimed[eventId][student]`  
- Business rule: `maxHoursPerEvent[eventId]` (0 = unlimited)  
- Metadata: `tokenURI(tokenId)` stores IPFS URI

Off-chain (FastAPI) 
- `/sign`: organizer signs EIP-712 voucher (domain matches chain + contract)  
- `/issue_signed`: verifies voucher & business rules, then calls `mintSBT`  
- Health endpoint & simple tools

---

## 🧱 Tech Stack

- Solidity (OZ 4.9.x) + Brownie
- Python 3.9+ / FastAPI / web3.py
- Sepolia** (RPC: `https://rpc.sepolia.org`) or local (Anvil/Ganache)

---

## 📦 Project layout (relevant)

import os, json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

# Load .env ở thư mục cha của offchain (../.env)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

RPC_URL = os.getenv("RPC_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")

if not RPC_URL:
    raise RuntimeError("RPC_URL missing in .env")
if not PRIVATE_KEY:
    raise RuntimeError("PRIVATE_KEY missing in .env")
if not CONTRACT_ADDRESS:
    raise RuntimeError("CONTRACT_ADDRESS missing in .env")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
acct = Account.from_key(PRIVATE_KEY)

# Đường dẫn ABI do Brownie build
ABI_PATH = os.path.join(os.path.dirname(__file__), "..", "build", "contracts", "SBT.json")
with open(ABI_PATH) as f:
    ABI = json.load(f)["abi"]

SBT = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI)

def _eip1559_fees():
    latest = w3.eth.get_block("latest")
    base = latest.get("baseFeePerGas", w3.to_wei(1, "gwei"))
    priority = w3.to_wei(2, "gwei")
    max_fee = base + priority * 2
    return max_fee, priority

def mint_sbt(to_addr: str, cid_hash: bytes, nonce32: bytes, event_id_hash: bytes, num_hours: int, organizer: str) -> str:
    max_fee, priority = _eip1559_fees()
    tx = SBT.functions.mintSBT(
        Web3.to_checksum_address(to_addr),
        cid_hash,
        nonce32,
        event_id_hash,
        int(num_hours),
        Web3.to_checksum_address(organizer)
    ).build_transaction({
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address),
        "maxFeePerGas": max_fee,
        "maxPriorityFeePerGas": priority,
    })
    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.transactionHash.hex()

def organizer_address() -> str:
    # Địa chỉ organizer đang chạy backend (lấy từ PRIVATE_KEY)
    return acct.address

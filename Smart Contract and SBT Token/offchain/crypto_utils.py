import os, time
from dotenv import load_dotenv
from eth_account import Account
from eth_account.messages import encode_structured_data
from web3 import Web3

# Load biến môi trường từ ../.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
CHAIN_ID = int(os.getenv("CHAIN_ID", "11155111"))  # Sepolia default

if not PRIVATE_KEY:
    raise RuntimeError("PRIVATE_KEY missing in .env")
if not CONTRACT_ADDRESS:
    raise RuntimeError("CONTRACT_ADDRESS missing in .env")

ORG_ADDR = Account.from_key(PRIVATE_KEY).address

# Domain EIP-712
EIP712_DOMAIN = {
    "name": "VolunteerChain",
    "version": "1",
    "chainId": CHAIN_ID,
    "verifyingContract": Web3.to_checksum_address(CONTRACT_ADDRESS),
}

# Types cho Issue message
TYPES = {
    "EIP712Domain": [
        {"name": "name", "type": "string"},
        {"name": "version", "type": "string"},
        {"name": "chainId", "type": "uint256"},
        {"name": "verifyingContract", "type": "address"},
    ],
    "Issue": [
        {"name": "student", "type": "address"},
        {"name": "eventId", "type": "string"},
        {"name": "role", "type": "string"},
        {"name": "hours", "type": "uint256"},
        {"name": "nonce", "type": "bytes32"},
        {"name": "expiresAt", "type": "uint256"},
    ],
}


def _build_typed(message: dict) -> dict:
    # Chuẩn hóa field để encode structured data
    msg = dict(message)
    msg["student"] = Web3.to_checksum_address(msg["student"])
    msg["hours"] = int(msg["hours"])
    msg["expiresAt"] = int(msg["expiresAt"])

    # nonce: cho phép input là "0x..." nhưng ép sang bytes(32) trước khi encode
    n = msg["nonce"]
    if isinstance(n, str):
        if not (n.startswith("0x") and len(n) == 66):
            raise ValueError("nonce must be 0x-prefixed 32-byte hex string")
        n_bytes = Web3.to_bytes(hexstr=n)
    elif isinstance(n, (bytes, bytearray)):
        n_bytes = bytes(n)
    else:
        raise ValueError("nonce must be hex string or bytes")

    if len(n_bytes) != 32:
        raise ValueError("nonce must be exactly 32 bytes")
    msg["nonce"] = n_bytes  # <-- quan trọng: dùng bytes cho typed message

    return {
        "types": TYPES,
        "domain": EIP712_DOMAIN,
        "primaryType": "Issue",
        "message": msg,
    }
     

def sign_issue(message: dict) -> str:
    acct = Account.from_key(PRIVATE_KEY)
    typed = _build_typed(message)
    signable = encode_structured_data(typed)
    signed = acct.sign_message(signable)
    return signed.signature.hex()

def verify_issue(signature: str, message: dict) -> str:
    typed = _build_typed(message)
    signable = encode_structured_data(typed)
    rec = Account.recover_message(signable, signature=signature)
    return Web3.to_checksum_address(rec)

def is_expired(ts: int) -> bool:
    try:
        return int(time.time()) > int(ts)
    except Exception:
        return True

import os, time
from typing import Tuple
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_typed_data

# load ../.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

CHAIN_ID = int(os.getenv("CHAIN_ID", "31337"))         # anvil=31337
CONTRACT_ADDRESS = Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS"))
ORG_PRIV = os.getenv("PRIVATE_KEY")
ORG_ADDR = Account.from_key(ORG_PRIV).address

# EIP-712 domain & types
DOMAIN = {
    "name": "VolunteerChain",
    "version": "1",
    "chainId": CHAIN_ID,
    "verifyingContract": CONTRACT_ADDRESS,
}
TYPES = {
    "Issue": [
        {"name":"student","type":"address"},
        {"name":"eventId","type":"string"},
        {"name":"role","type":"string"},
        {"name":"hours","type":"uint16"},
        {"name":"nonce","type":"bytes32"},
        {"name":"expiresAt","type":"uint64"},
    ]
}

def sign_issue(student: str, event_id: str, role: str, hours: int,
               *, ttl_seconds: int = 600) -> Tuple[str, dict]:
    """Organizer ký typed-data cho 1 yêu cầu mint; trả (signature_hex, message_dict)"""
    nonce = os.urandom(32)                                   # nonce ngẫu nhiên
    expires = int(time.time()) + ttl_seconds

    msg = {
        "student": Web3.to_checksum_address(student),
        "eventId": event_id,
        "role": role,
        "hours": int(hours),
        "nonce": nonce,
        "expiresAt": expires,
    }
    typed = encode_typed_data(full_message={"domain": DOMAIN, "types": TYPES, "primaryType": "Issue", "message": msg})
    sig = Account.sign_message(typed, private_key=ORG_PRIV).signature.hex()
    # serialize nonce -> hex để tiện trả qua JSON
    msg["nonce"] = "0x" + nonce.hex()
    return sig, msg

def verify_issue(signature_hex: str, message: dict) -> str:
    """Khôi phục địa chỉ signer từ chữ ký; trả về địa chỉ recovered (checksum)"""
    # convert nonce hex -> bytes
    msg = message.copy()
    if isinstance(msg.get("nonce"), str) and msg["nonce"].startswith("0x"):
        msg["nonce"] = bytes.fromhex(msg["nonce"][2:])
    msg["student"] = Web3.to_checksum_address(msg["student"])

    typed = encode_typed_data(full_message={"domain": DOMAIN, "types": TYPES, "primaryType": "Issue", "message": msg})
    rec = Account.recover_message(typed, signature=signature_hex)
    return Web3.to_checksum_address(rec)

def is_expired(expires_at: int) -> bool:
    return int(time.time()) > int(expires_at)

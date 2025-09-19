import os, json, sys
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account

# load ../.env (nơi offchain đang đọc)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

RPC_URL = os.getenv("RPC_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")  # sẽ dùng làm signer cho tx (nên là owner khi addOrganizer)

if not (RPC_URL and CONTRACT_ADDRESS and PRIVATE_KEY):
    raise SystemExit("Missing RPC_URL / CONTRACT_ADDRESS / PRIVATE_KEY in .env")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
acct = Account.from_key(PRIVATE_KEY)

ABI_PATH = os.path.join(os.path.dirname(__file__), "..", "build", "contracts", "SBT.json")
with open(ABI_PATH) as f:
    ABI = json.load(f)["abi"]

SBT = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI)

def fees_eip1559():
    latest = w3.eth.get_block("latest")
    base = latest.get("baseFeePerGas", w3.to_wei(1, "gwei"))
    tip = w3.to_wei(2, "gwei")
    return base + tip * 2, tip

def is_organizer(addr):
    ca = Web3.to_checksum_address(addr)
    try:
        # một số contract yêu cầu context from ngay cả khi call()
        return SBT.functions.isOrganizer(ca).call({"from": acct.address})
    except Exception:
        # fallback public mapping getter
        return SBT.functions.organizers(ca).call({"from": acct.address})

def _role_id(label: str) -> bytes:
    # chuẩn OpenZeppelin: keccak256("SOME_ROLE")
    return Web3.keccak(text=label)

def has_role(label: str, addr: str) -> bool:
    role = _role_id(label)
    return SBT.functions.hasRole(role, Web3.to_checksum_address(addr)).call()

def grant_role(label: str, addr: str) -> str:
    role = _role_id(label)
    max_fee, tip = fees_eip1559()
    tx = SBT.functions.grantRole(role, Web3.to_checksum_address(addr)).build_transaction({
        "from": acct.address,  # acct phải là admin (owner) mới grant được
        "nonce": w3.eth.get_transaction_count(acct.address),
        "maxFeePerGas": max_fee,
        "maxPriorityFeePerGas": tip,
    })
    signed = acct.sign_transaction(tx)
    txh = w3.eth.send_raw_transaction(signed.raw_transaction)
    rc = w3.eth.wait_for_transaction_receipt(txh)
    return rc.transactionHash.hex()

def add_organizer(addr):
    max_fee, tip = fees_eip1559()
    tx = SBT.functions.addOrganizer(Web3.to_checksum_address(addr)).build_transaction({
        "from": w3.eth.default_account,
        "nonce": w3.eth.get_transaction_count(w3.eth.default_account),
        "gas": 500000,
        "gasPrice": w3.to_wei("10", "gwei")
    })
    signed = acct.sign_transaction(tx)
    txh = w3.eth.send_raw_transaction(signed.raw_transaction)
    rc = w3.eth.wait_for_transaction_receipt(txh)
    return rc.transactionHash.hex()

def event_claimed(event_id_text, student):
    eid = Web3.keccak(text=event_id_text)
    return SBT.functions.eventClaimed(
        eid, Web3.to_checksum_address(student)
    ).call({"from": acct.address})

def used_nonce(nonce_hex):
    nb = bytes.fromhex(nonce_hex[2:] if nonce_hex.startswith("0x") else nonce_hex)
    return SBT.functions.usedNonces(nb).call({"from": acct.address})

def max_hours(event_id_text):
    eid = Web3.keccak(text=event_id_text)
    return SBT.functions.maxHoursPerEvent(eid).call({"from": acct.address})

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python sbt_tools.py is_organizer <address>")
        print("  python sbt_tools.py add_organizer <address>   # require OWNER key in .env")
        print("  python sbt_tools.py event_claimed <eventIdText> <studentAddr>")
        print("  python sbt_tools.py used_nonce <0x32byte_hex>")
        print("  python sbt_tools.py max_hours <eventIdText>")
        return

    cmd = sys.argv[1]
    if cmd == "is_organizer":
        print(is_organizer(sys.argv[2]))
    elif cmd == "add_organizer":
        print(add_organizer(sys.argv[2]))
    elif cmd == "event_claimed":
        print(event_claimed(sys.argv[2], sys.argv[3]))
    elif cmd == "used_nonce":
        print(used_nonce(sys.argv[2]))
    elif cmd == "max_hours":
        print(max_hours(sys.argv[2]))
    elif cmd == "has_role":
        # python3 sbt_tools.py has_role ORGANIZER_ROLE 0xYourAddr
        print(has_role(sys.argv[2], sys.argv[3]))
    elif cmd == "grant_role":
        # python3 sbt_tools.py grant_role ORGANIZER_ROLE 0xYourAddr
        print(grant_role(sys.argv[2], sys.argv[3]))	
    else:
        print("Unknown cmd")

if __name__ == "__main__":
    main()

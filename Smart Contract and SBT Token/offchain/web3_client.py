import os, json
from web3 import Web3
from eth_account import Account

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")

# Kết nối web3 + account organizer (từ .env)
w3 = Web3(Web3.HTTPProvider(RPC_URL))
acct = Account.from_key(PRIVATE_KEY)

# Lấy ABI từ build Brownie (đường dẫn tương đối từ offchain/)
with open("../build/contracts/SBT.json") as f:
    ABI = json.load(f)["abi"]

SBT = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI)

def mint_sbt(to_addr: str, cid_hash: bytes) -> str:
    """Gọi hàm mintSBT(to, bytes32 cidHash) và trả về txHash"""
    tx = SBT.functions.mintSBT(
        Web3.to_checksum_address(to_addr),
        cid_hash
    ).build_transaction({
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address),
        "gasPrice": w3.eth.gas_price,  # trên anvil base-fee=0 → OK
    })
    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.transactionHash.hex()

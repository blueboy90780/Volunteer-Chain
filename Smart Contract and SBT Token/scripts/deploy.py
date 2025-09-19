from brownie import accounts, SBT, network
import os

def main():
    print(f"Network: {network.show_active()}")
    pk = os.getenv("PRIVATE_KEY")
    if not pk:
        raise ValueError("PRIVATE_KEY missing in .env")

    acct = accounts.add(pk)
    print(f"Deployer: {acct.address}")

    c = SBT.deploy({"from": acct})
    print(f"SBT deployed at: {c.address}")

    # Whitelist organizer = chính deployer (hoặc một địa chỉ khác nếu bạn muốn)
    tx = c.addOrganizer(acct.address, {"from": acct})
    tx.wait(1)
    print(f"Organizer whitelisted: {acct.address}")

    # (Tùy chọn) đặt max hours cho 1 event demo
    # from web3 import Web3
    # eid = Web3.keccak(text="EVT-SEP-002")
    # c.setMaxHoursForEvent(eid, 8, {"from": acct})
    # print("Set max hours for EVT-SEP-002 = 8")

    return c

from brownie import accounts, SBT, network
import os, json

def main():
    print(f"Network: {network.show_active()}")
    pk = os.getenv("PRIVATE_KEY")
    if pk:
        acct = accounts.add(pk)
    else:
        # Fallback to first local account provided by Ganache
        acct = accounts[0]
    print(f"Deployer: {acct.address}")

    c = SBT.deploy({"from": acct})
    print(f"SBT deployed at: {c.address}")

    # Optionally write the deployed address to a shared file for other services
    shared_dir = os.getenv("SHARED_DIR")
    if shared_dir:
        try:
            os.makedirs(shared_dir, exist_ok=True)
            out_path = os.path.join(shared_dir, "contract-address.txt")
            with open(out_path, "w") as f:
                f.write(c.address)
            with open(os.path.join(shared_dir, "deploy.json"), "w") as f:
                json.dump({"address": c.address, "network": network.show_active()}, f)
            print(f"Wrote contract address to: {out_path}")
        except Exception as e:
            print(f"[warn] failed to write shared contract address: {e}")

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

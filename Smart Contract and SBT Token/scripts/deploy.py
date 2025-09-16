from brownie import SBT, accounts, network
import os

def main():
    acct = accounts.add(os.getenv("PRIVATE_KEY"))
    print("Deployer:", acct.address, "on", network.show_active())
    organizer = acct.address  # demo: organizer = deployer
    c = SBT.deploy(organizer, {"from": acct})
    print("SBT deployed at:", c.address)

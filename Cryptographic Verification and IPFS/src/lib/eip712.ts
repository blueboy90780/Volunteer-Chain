import { keccak256, toUtf8Bytes } from "ethers";
import type { TypedDataDomain, Signer } from "ethers";
import { Wallet, verifyTypedData } from "ethers";
import { randomBytes } from "node:crypto";
import { env, requireEnv } from "./env.js";
import type { Voucher, SignedVoucher } from "../types/voucher.js";

export type Organizer = {
  address: `0x${string}`;
};

export function makeNonce(bytes = 12): string {
  return `0x${Buffer.from(randomBytes(bytes)).toString("hex")}`;
}

export function defaultDomain(
  chainId: number = 11155111,
  verifyingContract: string = "0x0000000000000000000000000000000000000000"
): TypedDataDomain {
  // chainId default is Sepolia; verifyingContract can be replaced later with real address
  return {
    name: "VolunteerChainVoucher",
    version: "1",
    chainId,
    verifyingContract,
  };
}

export const voucherTypes = {
  Voucher: [
    { name: "studentWallet", type: "address" },
    { name: "eventId", type: "string" },
    { name: "hours", type: "uint256" },
    { name: "role", type: "string" },
    { name: "ipfsCID", type: "string" },
    { name: "nonce", type: "bytes" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export function getOrganizerWallet(): Signer {
  const pk = env.ORGANIZER_PRIVATE_KEY;
  if (pk && pk.startsWith("0x")) return new Wallet(pk);
  // Fallback: ephemeral wallet for demo if no key is provided
  const w = Wallet.createRandom();
  // eslint-disable-next-line no-console
  console.warn(
    "[demo] ORGANIZER_PRIVATE_KEY not set; using ephemeral organizer wallet:",
    w.address
  );
  return w;
}

export async function signVoucher(
  voucher: Voucher,
  domain = defaultDomain()
): Promise<SignedVoucher> {
  const wallet = getOrganizerWallet();
  const signature = await wallet.signTypedData(
    domain,
    voucherTypes as any,
    voucher as any
  );
  return { voucher, signature };
}

export function recoverSigner(
  voucher: Voucher,
  signature: string,
  domain = defaultDomain()
): `0x${string}` {
  const signer = verifyTypedData(
    domain,
    voucherTypes as any,
    voucher as any,
    signature
  ) as `0x${string}`;
  return signer;
}

export function verifyVoucher(
  { voucher, signature }: SignedVoucher,
  allowedOrganizers: Set<string>,
  domain = defaultDomain()
): {
  ok: boolean;
  reason?: string;
  recovered?: `0x${string}`;
} {
  try {
    const now = Math.floor(Date.now() / 1000);
    if (voucher.deadline < now) {
      return { ok: false, reason: "Voucher expired" };
    }
    const recovered = recoverSigner(voucher, signature, domain);
    if (!allowedOrganizers.has(recovered.toLowerCase())) {
      return { ok: false, reason: "Unauthorized organizer", recovered };
    }
    return { ok: true, recovered };
  } catch (err: any) {
    return { ok: false, reason: err?.message ?? "Verify failed" };
  }
}

export function mockOnChainVerify(
  signed: SignedVoucher,
  allowedOrganizers: Set<string>
): Promise<{ success: boolean; txHash: string; organizer: string }> {
  // Simulate a call to a testnet contract that checks EIP-712 and organizer allowlist.
  const res = verifyVoucher(signed, allowedOrganizers);
  return Promise.resolve({
    success: res.ok,
    txHash: res.ok ? `0x${"ab".repeat(32)}` : `0x${"00".repeat(32)}`,
    organizer: (res.recovered ??
      "0x0000000000000000000000000000000000000000") as string,
  });
}

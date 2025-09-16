import { env } from "./lib/env.js";
import { pinJSONToIPFS } from "./lib/pinata.js";
import {
  makeNonce,
  signVoucher,
  verifyVoucher,
  mockOnChainVerify,
} from "./lib/eip712.js";
import { makeQRCode } from "./lib/qrcode.js";
import type { Voucher } from "./types/voucher.js";
import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  // 1) Off-chain metadata (IPFS)
  const metadata = {
    eventId: "event-2025-09-open-day",
    eventName: "University Open Day",
    date: "2025-09-10",
    role: "Volunteer Guide",
    hours: 4,
    organizer: "RMIT Student Union",
  };

  console.log("Pinning event metadata to IPFS via Pinata...");
  const pinned = await pinJSONToIPFS(
    `VolunteerChain-${metadata.eventId}`,
    metadata
  );
  console.log("Pinned CID:", pinned.cid);
  console.log("Gateway URL:", pinned.url);

  // 2) Voucher creation & signing (EIP-712)
  const voucher: Voucher = {
    studentWallet: "0x1111111111111111111111111111111111111111",
    eventId: metadata.eventId,
    hours: metadata.hours,
    role: metadata.role,
    ipfsCID: pinned.cid,
    nonce: makeNonce(),
    deadline: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiry
  };

  console.log("Signing voucher...");
  const signed = await signVoucher(voucher);
  console.log("Signature:", signed.signature);

  // 3) Off-chain verification (mock)
  const allowed = new Set<string>();
  // Assume the signer address is an allowed/registered organizer (we recover below)
  const mock = await mockOnChainVerify(signed, allowed);
  // Recover to learn real address, then allow and verify again
  const firstAllow = await mockOnChainVerify(signed, allowed);
  console.log("First mock verify (no organizer):", firstAllow);

  // recover and allow
  const { verifyVoucher: _v } = await import("./lib/eip712.js");
  const rec = _v({ voucher, signature: signed.signature }, new Set());
  if (rec.recovered) allowed.add(rec.recovered.toLowerCase());

  const finalCheck = await mockOnChainVerify(signed, allowed);
  console.log("Mock on-chain verify:", finalCheck);

  // 4) QR code generation
  const qrPayload = {
    // encourage short payloads: just include a URL to a backend that serves full signed voucher JSON
    url: `https://example.org/v1/voucher/${encodeURIComponent(
      voucher.eventId
    )}/${voucher.nonce}`,
    cid: pinned.cid,
    sig: signed.signature,
  };
  const outPng = path.join("outputs", `voucher-${voucher.eventId}.png`);
  console.log("Generating QR code at", outPng);
  const dataUrl = await makeQRCode(qrPayload, outPng);
  await fs.writeFile(
    path.join("outputs", `voucher-${voucher.eventId}.json`),
    JSON.stringify({ voucher, signature: signed.signature }, null, 2)
  );
  console.log("QR code data URL (truncated):", dataUrl.slice(0, 64) + "...");

  console.log(
    "\nDone. Next step: integrate with the SBT contract mintWithSignature on testnet."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

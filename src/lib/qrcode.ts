import QRCode from "qrcode";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type QRPayload = {
  // A compact payload to embed in the QR, pointing to remote JSON if large
  url?: string; // URL to fetch full voucher JSON (e.g., from your server/IPFS gateway)
  cid?: string; // Direct CID when safe
  sig?: string; // signature or reference id
};

export async function makeQRCode(
  payload: QRPayload,
  outPath: string
): Promise<string> {
  const data = JSON.stringify(payload);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await QRCode.toFile(outPath, data, {
    errorCorrectionLevel: "M",
    width: 512,
    margin: 1,
  });
  const dataUrl = await QRCode.toDataURL(data);
  return dataUrl;
}

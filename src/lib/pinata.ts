import { PinataSDK } from "pinata";
import { Blob } from "buffer";
import { env } from "./env.js";

export type PinResult = {
  cid: string;
  url: string; // gateway url
};

function gatewayDomainFromEnv(gw: string | undefined): string | undefined {
  if (!gw) return undefined;
  try {
    const u = new URL(gw.includes("http") ? gw : `https://${gw}`);
    return u.hostname; // e.g., gateway.pinata.cloud or <your-domain>.mypinata.cloud
  } catch {
    return undefined;
  }
}

const pinata = new PinataSDK({
  pinataJwt: env.PINATA_JWT, // recommend JWT
  pinataGateway: gatewayDomainFromEnv(env.PINATA_GATEWAY),
});

export async function pinJSONToIPFS(
  name: string,
  data: unknown
): Promise<PinResult> {
  // Use the SDK's file upload with a JSON Blob to ensure Node.js compatibility
  // Note: Some SDK versions' json uploader use browser File, which isn't available in Node
  const uploadApi: any =
    (pinata as any).upload?.public ?? (pinata as any).upload;
  if (!uploadApi) throw new Error("Pinata SDK upload API not available");

  const jsonBlob = new Blob([JSON.stringify(data)], {
    type: "application/json",
  });
  const res = await uploadApi.file(jsonBlob, { name: `${name}.json` });

  // Expected response contains `cid`
  const cid: string = res.cid ?? res.IpfsHash;
  if (!cid) throw new Error("Pinata SDK response missing cid");

  // Use the SDK to generate a proper gateway URL when available
  try {
    const converted = await (pinata as any).gateways?.public?.convert?.(cid);
    if (typeof converted === "string" && converted.length > 0) {
      return { cid, url: converted };
    }
  } catch {
    // ignore and fall back below
  }

  // Fallback to env-configured gateway (string concat)
  const base = env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud/ipfs/";
  const url = `${base}${cid}`;
  return { cid, url };
}

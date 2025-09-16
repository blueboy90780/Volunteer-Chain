import axios from "axios";
import { env, requireEnv } from "./env.js";

export type PinResult = {
  cid: string;
  url: string; // gateway url
};

const PINATA_BASE = "https://api.pinata.cloud";

export async function pinJSONToIPFS(
  name: string,
  data: unknown
): Promise<PinResult> {
  // Prefer JWT auth if provided
  const jwt = env.PINATA_JWT;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  } else {
    headers["pinata_api_key"] = requireEnv("PINATA_API_KEY");
    headers["pinata_secret_api_key"] = requireEnv("PINATA_API_SECRET");
  }

  const body = {
    pinataOptions: { cidVersion: 1 },
    pinataMetadata: { name },
    pinataContent: data,
  };

  const res = await axios.post(`${PINATA_BASE}/pinning/pinJSONToIPFS`, body, {
    headers,
  });
  const IpfsHash: string = res.data.IpfsHash; // CIDv1 when cidVersion:1
  return { cid: IpfsHash, url: `${env.PINATA_GATEWAY}${IpfsHash}` };
}

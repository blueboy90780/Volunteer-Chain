import * as dotenv from "dotenv";
import path from "node:path";

// Load .env from repo root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type Env = {
  PINATA_JWT?: string;
  PINATA_API_KEY?: string;
  PINATA_API_SECRET?: string;
  PINATA_GATEWAY?: string;
  ORGANIZER_PRIVATE_KEY?: string;
};

export const env: Env = {
  PINATA_JWT: process.env.PINATA_JWT,
  PINATA_API_KEY: process.env.PINATA_API_KEY,
  PINATA_API_SECRET: process.env.PINATA_API_SECRET,
  PINATA_GATEWAY:
    process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud/ipfs/",
  ORGANIZER_PRIVATE_KEY: process.env.ORGANIZER_PRIVATE_KEY,
};

export function requireEnv<K extends keyof Env>(key: K): string {
  const val = env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

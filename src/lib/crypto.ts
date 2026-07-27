/**
 * AES-256-GCM encryption for secrets at rest (tenant bot tokens, affiliate
 * tokens). Key: FLEET_TOKEN_KEY env, 64 hex chars. Output format:
 * base64(iv) + "." + base64(ciphertext+tag).
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(): Buffer {
  const hex = process.env.FLEET_TOKEN_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "FLEET_TOKEN_KEY must be 64 hex chars (generate: openssl rand -hex 32)",
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tagged = Buffer.concat([enc, cipher.getAuthTag()]);
  return `${iv.toString("base64")}.${tagged.toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  const [ivB64, dataB64] = stored.split(".");
  if (!ivB64 || !dataB64) throw new Error("malformed encrypted secret");
  const iv = Buffer.from(ivB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const tag = data.subarray(data.length - 16);
  const enc = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

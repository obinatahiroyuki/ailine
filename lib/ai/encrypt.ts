/**
 * APIキーの保存用エンコード
 * ENCRYPTION_KEY が設定されている場合は AES で暗号化、未設定時は base64 でエンコード
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function getKey(): Buffer | null {
  const secret = process.env.ENCRYPTION_KEY ?? process.env.AUTH_SECRET;
  if (!secret) return null;
  return scryptSync(secret, "ailine-salt", KEY_LENGTH);
}

export function encryptApiKey(plainText: string): string {
  const key = getKey();
  if (!key) {
    return Buffer.from(plainText, "utf8").toString("base64");
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptApiKey(encrypted: string): string {
  const buffer = Buffer.from(encrypted, "base64");
  const key = getKey();
  if (!key || buffer.length < IV_LENGTH + 16 + 1) {
    return Buffer.from(encrypted, "base64").toString("utf8");
  }
  try {
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
    const data = buffer.subarray(IV_LENGTH + 16);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(data) + decipher.final("utf8");
  } catch {
    return Buffer.from(encrypted, "base64").toString("utf8");
  }
}

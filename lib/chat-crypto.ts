import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const raw = process.env.CHAT_CONTENT_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("CHAT_CONTENT_ENCRYPTION_KEY is not set");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `CHAT_CONTENT_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes`,
    );
  }
  return key;
}

export function encryptChatText(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([encrypted, tag]);
  return `${PREFIX}${iv.toString("base64")}:${payload.toString("base64")}`;
}

export function decryptChatText(stored: string): string {
  if (!stored.startsWith(PREFIX)) {
    return stored;
  }

  const rest = stored.slice(PREFIX.length);
  const sep = rest.indexOf(":");
  if (sep <= 0) {
    throw new Error("Invalid encrypted chat text format");
  }

  const iv = Buffer.from(rest.slice(0, sep), "base64");
  const payload = Buffer.from(rest.slice(sep + 1), "base64");
  if (iv.length !== IV_LENGTH || payload.length <= 16) {
    throw new Error("Invalid encrypted chat text payload");
  }

  const ciphertext = payload.subarray(0, payload.length - 16);
  const tag = payload.subarray(payload.length - 16);
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

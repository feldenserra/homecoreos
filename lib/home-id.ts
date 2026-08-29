import { randomInt } from "node:crypto";

/** Ambiguity-safe charset (no 0/O, 1/I/L). */
const HOME_ID_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateHomeId(length = 8): string {
  let id = "";
  for (let i = 0; i < length; i += 1) {
    id += HOME_ID_CHARSET[randomInt(HOME_ID_CHARSET.length)];
  }
  return id;
}

export function normalizeHomeId(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/gi, "");
}

export function isValidHomeId(id: string): boolean {
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(id);
}

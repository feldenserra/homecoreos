import { randomInt } from "node:crypto";

/** Ambiguity-safe charset (no 0/O, 1/I/L). */
const HOME_ID_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const HOME_ID_LENGTH = 12;
export const MAX_CREATED_HOMES = 1;
export const MAX_JOINED_HOMES = 5;

export function generateHomeId(length = HOME_ID_LENGTH): string {
  let id = "";
  for (let i = 0; i < length; i += 1) {
    id += HOME_ID_CHARSET[randomInt(HOME_ID_CHARSET.length)];
  }
  return id;
}

export function normalizeHomeId(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/gi, "");
}

/** New homes are 12 characters; 8-character IDs remain valid. */
export function isValidHomeId(id: string): boolean {
  return (
    /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(id) ||
    /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/.test(id)
  );
}

/**
 * The household join code.
 *
 * Renamed from lib/home-id.ts because it is no longer the home's identity:
 * `home.id` is a uuid and `home.code` is this separate, human-typeable value.
 * Keeping the old name would invite passing one where the other is meant.
 *
 * `generateHomeId` is gone — generation moved to the `generate_home_code()`
 * SQL function. It used `node:crypto.randomInt`, which does not exist in React
 * Native, and generating a capability on an untrusted client was never right.
 */

/** Ambiguity-safe charset (no 0/O, 1/I/L). */
const HOME_CODE_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const HOME_CODE_LENGTH = 12;
export const MAX_CREATED_HOMES = 1;
export const MAX_JOINED_HOMES = 5;

export function normalizeHomeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/gi, "");
}

/**
 * Codes are exactly 12 characters. The old 8-character form is no longer
 * accepted: at 32^8 it was about 2^40, which is thin for a bearer token that
 * grants access to a household, and the Supabase database starts empty so there
 * are none to honour.
 */
export function isValidHomeCode(code: string): boolean {
  return new RegExp(
    `^[${HOME_CODE_CHARSET}]{${HOME_CODE_LENGTH}}$`,
  ).test(code);
}

/** Groups a code as XXXX-XXXX-XXXX for display. */
export function formatHomeCode(code: string): string {
  return normalizeHomeCode(code).replace(/(.{4})(?=.)/g, "$1-");
}

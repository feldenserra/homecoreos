/**
 * Marketing-only mode: hides the sign-in and sign-up entry points.
 *
 * This used to be a server-side kill switch enforced by middleware.ts, which
 * could refuse the request outright. In a client app it can only hide UI — a
 * determined caller still reaches Supabase Auth directly. To actually close
 * signups, turn the providers off in the Supabase dashboard (or set
 * `[auth] enable_signup = false`); this flag just keeps the app from offering
 * something the backend will refuse.
 */
export function loginsAllowed(): boolean {
  const raw = process.env.EXPO_PUBLIC_ALLOW_LOGINS?.trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "off";
}

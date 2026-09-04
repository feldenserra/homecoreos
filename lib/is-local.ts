/**
 * Local / self-host mode: hide features that only work against cloud Auth
 * (e.g. GitHub OAuth on the login screen).
 *
 * Unset means not local — production and cloud builds keep those UI paths.
 */
export function isLocal(): boolean {
  const raw = process.env.EXPO_PUBLIC_IS_LOCAL?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "on";
}

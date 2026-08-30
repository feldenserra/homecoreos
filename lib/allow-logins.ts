export function loginsAllowed(): boolean {
  const raw = process.env.ALLOW_LOGINS?.trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "off";
}

export function isRunningLocal(): boolean {
  return process.env.RUNNING_LOCAL === "true";
}

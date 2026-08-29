export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful household assistant. A digital butler";

export const MAX_SYSTEM_PROMPT_LENGTH = 4000;

export function normalizeSystemPrompt(raw: string | undefined): string {
  const trimmed = String(raw ?? "").trim();
  return trimmed || DEFAULT_SYSTEM_PROMPT;
}

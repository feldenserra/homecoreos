import type { AiKeySource } from "../types";
import { callFunction } from "./functions";

/**
 * Per-user AI provider credentials. Replaces app/app/ai-key-actions.ts.
 *
 * These go through an Edge Function rather than direct queries because the
 * Ollama URL and Cloudflare token are encrypted at rest, and the key stays
 * server-side. The stored API key is never returned — only `hasApiKey` — which
 * is why editing a Cloudflare model can leave the key field blank.
 */

export type AiKeyListItem = {
  id: string;
  source: AiKeySource;
  url: string | null;
  model: string | null;
  accountId: string | null;
  hasApiKey: boolean;
};

export type SaveAiKeyInput = {
  source: AiKeySource;
  url?: string;
  model?: string;
  accountId?: string;
  apiKey?: string;
};

export async function listAiKeys(): Promise<AiKeyListItem[]> {
  const { keys } = await callFunction<{ keys: AiKeyListItem[] }>("ai-keys");
  return keys;
}

export async function saveAiKey(input: SaveAiKeyInput): Promise<void> {
  await callFunction("ai-keys", { method: "POST", body: input });
}

export async function deleteAiKey(source: AiKeySource): Promise<void> {
  await callFunction(`ai-keys?source=${encodeURIComponent(source)}`, {
    method: "DELETE",
  });
}

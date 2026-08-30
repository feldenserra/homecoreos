import type { AiKeySource } from "../types";
import { createOpenAiCompatibleProvider } from "./providers/openai-compatible";
import type { AiProvider } from "./types";

export type AiProviderConfig = {
  source: AiKeySource;
  model: string;
  url?: string | null;
  accountId?: string | null;
  apiKey?: string | null;
};

function ollamaBaseUrl(url: string) {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

export function createAiProviderFromConfig(config: AiProviderConfig): AiProvider {
  const model = config.model.trim();
  if (!model) {
    throw new Error("Model is required.");
  }

  if (config.source === "ollama") {
    const url = config.url?.trim() ?? "";
    if (!url) {
      throw new Error("Ollama URL is required.");
    }
    return createOpenAiCompatibleProvider({
      id: "ollama",
      apiKey: "ollama",
      baseURL: ollamaBaseUrl(url),
      model,
    });
  }

  const accountId = config.accountId?.trim() ?? "";
  const apiKey = config.apiKey?.trim() ?? "";
  if (!accountId || !apiKey) {
    throw new Error("Cloudflare account ID and API key are required.");
  }

  return createOpenAiCompatibleProvider({
    id: "cloudflare",
    apiKey,
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
    model,
  });
}

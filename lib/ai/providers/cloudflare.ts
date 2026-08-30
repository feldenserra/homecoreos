import type { AiProvider } from "../types";
import { createOpenAiCompatibleProvider } from "./openai-compatible";

function cloudflareBaseUrl(accountId: string) {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;
}

export function createCloudflareProvider(options: {
  accountId: string;
  apiKey: string;
  model: string;
}): AiProvider {
  return createOpenAiCompatibleProvider({
    id: "cloudflare",
    apiKey: options.apiKey,
    baseURL: cloudflareBaseUrl(options.accountId),
    model: options.model,
  });
}

import { createOpenAiCompatibleProvider } from "./providers/openai-compatible";
import type { AiProvider, AiProviderId } from "./types";

function readProviderId(): AiProviderId {
  const raw = (process.env.AI_PROVIDER ?? "ollama").trim().toLowerCase();
  if (raw === "openai" || raw === "ollama") {
    return raw;
  }
  throw new Error(
    `Unsupported AI_PROVIDER "${raw}". Use "ollama" or "openai".`,
  );
}

export function getAiProvider(): AiProvider {
  const id = readProviderId();
  const model =
    process.env.AI_MODEL?.trim() ||
    (id === "openai" ? "gpt-4o-mini" : "llama3.2");
  const apiKey =
    process.env.AI_API_KEY?.trim() || (id === "ollama" ? "ollama" : "");

  if (!apiKey) {
    throw new Error("AI_API_KEY is required when AI_PROVIDER=openai");
  }

  const baseURL =
    process.env.AI_BASE_URL?.trim() ||
    (id === "ollama" ? "http://127.0.0.1:11434/v1" : undefined);

  return createOpenAiCompatibleProvider({
    id,
    apiKey,
    baseURL,
    model,
  });
}

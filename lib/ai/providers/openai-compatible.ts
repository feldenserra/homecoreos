import OpenAI from "openai";
import type { AiProvider, AiProviderId, AiStreamChatInput } from "../types";

export function createOpenAiCompatibleProvider(options: {
  id: AiProviderId;
  apiKey: string;
  baseURL?: string;
  model: string;
}): AiProvider {
  const client = new OpenAI({
    apiKey: options.apiKey,
    ...(options.baseURL ? { baseURL: options.baseURL } : {}),
  });

  return {
    id: options.id,
    model: options.model,
    async *streamChat(input: AiStreamChatInput) {
      const stream = await client.chat.completions.create({
        model: input.model ?? options.model,
        messages: input.messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    },
  };
}

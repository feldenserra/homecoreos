export type AiChatRole = "system" | "user" | "assistant";

export type AiChatMessage = {
  role: AiChatRole;
  content: string;
};

export type AiStreamChatInput = {
  messages: AiChatMessage[];
  model?: string;
};

export type AiProviderId = "ollama" | "openai";

export type AiProvider = {
  id: AiProviderId;
  model: string;
  streamChat: (input: AiStreamChatInput) => AsyncIterable<string>;
};

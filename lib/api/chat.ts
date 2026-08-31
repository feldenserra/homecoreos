import { fetch as expoFetch } from "expo/fetch";
import type { AiKeySource, ChatMessageRole } from "../types";
import { callFunction, functionHeaders, functionUrl } from "./functions";

/**
 * Chat. Replaces app/app/chat-actions.ts and the client half of
 * components/chat/chat-app.tsx.
 *
 * Everything here is an Edge Function call: message bodies, titles and system
 * prompts are encrypted at rest and only the function can read them.
 */

export type ChatConversationSummary = {
  id: string;
  homeId: string;
  title: string;
  updatedAt: string;
};

export type ChatConversationDetail = ChatConversationSummary & {
  systemPrompt: string | null;
  aiSource: AiKeySource | null;
  aiModel: string | null;
};

export type ChatMessageRow = {
  id: string;
  conversationId: string;
  homeId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

export async function listConversations(
  homeId: string,
): Promise<ChatConversationSummary[]> {
  const { conversations } = await callFunction<{
    conversations: ChatConversationSummary[];
  }>(`conversations?homeId=${encodeURIComponent(homeId)}`);
  return conversations;
}

export async function getConversation(
  homeId: string,
  conversationId: string,
): Promise<{
  conversation: ChatConversationDetail;
  messages: ChatMessageRow[];
}> {
  return await callFunction(
    `conversations?homeId=${encodeURIComponent(homeId)}&conversationId=${encodeURIComponent(conversationId)}`,
  );
}

export async function createConversation(homeId: string): Promise<string> {
  const { id } = await callFunction<{ id: string }>("conversations", {
    method: "POST",
    body: { homeId },
  });
  return id;
}

export async function deleteConversation(
  homeId: string,
  conversationId: string,
): Promise<void> {
  await callFunction(
    `conversations?homeId=${encodeURIComponent(homeId)}&conversationId=${encodeURIComponent(conversationId)}`,
    { method: "DELETE" },
  );
}

export type ChatStreamMeta = {
  conversationId: string;
  userMessageId: string;
  provider: string;
  model: string;
};

export type ChatStreamHandlers = {
  onMeta?: (meta: ChatStreamMeta) => void;
  onDelta?: (text: string) => void;
  onDone?: (done: {
    conversationId: string;
    assistantMessageId: string;
  }) => void;
  onError?: (message: string) => void;
};

function dispatchFrame(frame: string, handlers: ChatStreamHandlers): void {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(dataLines.join("\n"));
  } catch {
    return;
  }

  switch (event) {
    case "meta":
      handlers.onMeta?.(payload as unknown as ChatStreamMeta);
      break;
    case "delta":
      if (typeof payload.text === "string") {
        handlers.onDelta?.(payload.text);
      }
      break;
    case "done":
      handlers.onDone?.(
        payload as unknown as {
          conversationId: string;
          assistantMessageId: string;
        },
      );
      break;
    case "error":
      handlers.onError?.(
        typeof payload.error === "string"
          ? payload.error
          : "Provider request failed",
      );
      break;
  }
}

/**
 * Streams a reply, calling handlers as SSE frames arrive.
 *
 * Uses `expo/fetch`, not the global one. React Native's built-in fetch is a
 * whatwg-fetch shim over XMLHttpRequest: `response.body` is null, so the stream
 * would silently buffer to completion — the reply would appear all at once, or
 * the call would hang. `expo/fetch` is WinterCG-compliant over native
 * URLSession/OkHttp and returns a real ReadableStream.
 *
 * `supabase.functions.invoke` cannot be used here for the same reason.
 */
export async function streamChat(
  input: {
    homeId: string;
    conversationId?: string;
    message: string;
    systemPrompt?: string;
    aiSource?: AiKeySource;
  },
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await expoFetch(functionUrl("chat"), {
    method: "POST",
    headers: await functionHeaders(),
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      payload?.error ?? `Chat failed with status ${response.status}.`,
    );
  }

  if (!response.body) {
    throw new Error("This platform cannot stream chat responses.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      // Sequential by nature: each read waits for the next network chunk.
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line; a frame can span reads.
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
        dispatchFrame(frame, handlers);
      }
    }

    if (buffer.trim()) {
      dispatchFrame(buffer, handlers);
    }
  } finally {
    reader.releaseLock();
  }
}

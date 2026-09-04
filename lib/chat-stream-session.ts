import type { AiKeySource } from "./types";

/**
 * Module-level stream session so the first-message SSE survives the Expo Router
 * remount when `/chat/new` is replaced with `/chat/[conversationId]`.
 *
 * Without this, ChatView's unmount abort tears down the in-flight fetch and the
 * newly mounted screen starts blank.
 */

export type ChatUiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatStreamSnapshot = {
  homeId: string;
  conversationId: string | null;
  messages: ChatUiMessage[];
  streaming: boolean;
  systemPrompt: string;
  aiSource: AiKeySource | null;
  aiModel: string | null;
  error: string | null;
  /** True while navigating from /new → /[id]; unmount must not abort. */
  handoff: boolean;
};

type Listener = (snapshot: ChatStreamSnapshot) => void;

type SessionState = ChatStreamSnapshot & {
  abort: AbortController | null;
};

let session: SessionState | null = null;
const listeners = new Set<Listener>();

function snapshotOf(state: SessionState): ChatStreamSnapshot {
  return {
    homeId: state.homeId,
    conversationId: state.conversationId,
    messages: state.messages,
    streaming: state.streaming,
    systemPrompt: state.systemPrompt,
    aiSource: state.aiSource,
    aiModel: state.aiModel,
    error: state.error,
    handoff: state.handoff,
  };
}

function notify() {
  if (!session) {
    return;
  }
  const snap = snapshotOf(session);
  for (const listener of listeners) {
    listener(snap);
  }
}

export function subscribeChatStream(listener: Listener): () => void {
  listeners.add(listener);
  if (session) {
    listener(snapshotOf(session));
  }
  return () => {
    listeners.delete(listener);
  };
}

export function getChatStreamSnapshot(): ChatStreamSnapshot | null {
  return session ? snapshotOf(session) : null;
}

/** Whether a mounted ChatView can adopt this live session instead of reloading. */
export function canAdoptChatStream(
  homeId: string,
  conversationId: string | undefined,
): boolean {
  if (!session?.streaming) {
    return false;
  }
  if (session.homeId !== homeId) {
    return false;
  }
  // New screen remounted as /[id] after handoff.
  if (conversationId && session.conversationId === conversationId) {
    return true;
  }
  // Still on /new while stream started (rare race before replace).
  if (!conversationId && session.conversationId === null) {
    return true;
  }
  return false;
}

export function beginChatStream(input: {
  homeId: string;
  conversationId: string | null;
  messages: ChatUiMessage[];
  systemPrompt: string;
  aiSource: AiKeySource | null;
  aiModel: string | null;
  abort: AbortController;
}): void {
  // A new send supersedes any prior session for this home.
  if (session?.abort && session.streaming) {
    session.abort.abort();
  }

  session = {
    homeId: input.homeId,
    conversationId: input.conversationId,
    messages: input.messages,
    streaming: true,
    systemPrompt: input.systemPrompt,
    aiSource: input.aiSource,
    aiModel: input.aiModel,
    error: null,
    handoff: false,
    abort: input.abort,
  };
  notify();
}

export function updateChatStreamMessages(messages: ChatUiMessage[]): void {
  if (!session) {
    return;
  }
  session.messages = messages;
  notify();
}

export function setChatStreamConversationId(conversationId: string): void {
  if (!session) {
    return;
  }
  session.conversationId = conversationId;
  session.handoff = true;
  notify();
}

export function setChatStreamError(error: string | null): void {
  if (!session) {
    return;
  }
  session.error = error;
  notify();
}

export function finishChatStream(messages?: ChatUiMessage[]): void {
  if (!session) {
    return;
  }
  if (messages) {
    session.messages = messages;
  }
  session.streaming = false;
  session.handoff = false;
  session.abort = null;
  notify();
}

/**
 * Abort only when leaving the thread for real — not when Expo remounts during
 * the new → conversationId handoff.
 */
export function releaseChatStreamOwner(
  homeId: string,
  conversationId: string | undefined,
): void {
  if (!session || session.homeId !== homeId) {
    return;
  }

  // Handoff in progress: the next screen will adopt; keep the abort controller.
  if (session.handoff && session.streaming) {
    return;
  }

  // Still streaming the same conversation — another mount may adopt.
  if (
    session.streaming &&
    conversationId &&
    session.conversationId === conversationId
  ) {
    return;
  }

  // Streaming a new chat that hasn't received meta yet; leaving /new for real.
  if (session.streaming && session.conversationId === null && !conversationId) {
    // Ambiguous: unmount of /new during handoff also looks like this briefly
    // before setChatStreamConversationId runs. Prefer not aborting if handoff
    // was already set; otherwise abort (user navigated away).
    if (!session.handoff) {
      session.abort?.abort();
      session.streaming = false;
      session.abort = null;
      notify();
    }
    return;
  }

  if (session.streaming) {
    session.abort?.abort();
    session.streaming = false;
    session.abort = null;
    notify();
  }
}

export function clearChatStreamHandoff(): void {
  if (!session) {
    return;
  }
  session.handoff = false;
}

export function clearChatStream(): void {
  if (session?.abort && session.streaming) {
    session.abort.abort();
  }
  session = null;
  notify();
}

/**
 * Streaming chat. Replaces app/api/chat/route.ts.
 *
 * Server-side because it holds three things a device must not: the content
 * encryption key, the user's decrypted provider credentials, and the outbound
 * call to Ollama or Cloudflare.
 *
 * Response is SSE with the same four events the web client already spoke —
 * `meta`, `delta`, `error`, `done` — so the message protocol did not change,
 * only the transport endpoint.
 *
 * Two behavioural improvements over the Next.js version, both forced by mobile:
 *
 *  - The assistant reply is persisted even if the client vanishes mid-stream.
 *    Previously the insert happened inside the stream controller after the last
 *    delta, so backgrounding the app lost the reply permanently. Now the
 *    provider is drained regardless of whether anyone is listening, and a
 *    cancelled stream schedules the write through EdgeRuntime.waitUntil.
 *  - The assistant message id is generated up front rather than read back from
 *    the insert, so `done` can be sent without waiting on the database.
 */
import {
  createAiProviderFromConfig,
  type AiChatMessage,
  type AiProviderConfig,
  type AiProviderId,
} from "../_shared/ai.ts";
import { decryptChatText, encryptChatText } from "../_shared/crypto.ts";
import {
  CORS_HEADERS,
  errorResponse,
  isCallerError,
  preflight,
  requireCaller,
} from "../_shared/http.ts";

// Supabase Edge Runtime global; keeps work alive after the response is sent.
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful household assistant. A digital butler";
const MAX_SYSTEM_PROMPT_LENGTH = 4000;
const MAX_MESSAGE_LENGTH = 8000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AI_KEY_SOURCES = ["ollama", "cloudflare"] as const;

type AiKeySource = (typeof AI_KEY_SOURCES)[number];

type Snapshot = {
  aiSource: AiKeySource;
  aiModel: string;
  aiUrl: string | null;
  aiAccountId: string | null;
  aiApiKey: string | null;
};

class ChatRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function isAiKeySource(value: string): value is AiKeySource {
  return (AI_KEY_SOURCES as readonly string[]).includes(value);
}

function normalizeSystemPrompt(raw: string | undefined): string {
  return String(raw ?? "").trim() || DEFAULT_SYSTEM_PROMPT;
}

function titleFromMessage(message: string): string {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 48) {
    return cleaned || "New chat";
  }
  return `${cleaned.slice(0, 45)}…`;
}

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * The snapshot stored on the conversation keeps url and apiKey as ciphertext —
 * it is copied straight across from user_ai_key, not decrypted and re-encrypted.
 */
function snapshotFromKey(key: {
  source: AiKeySource;
  url: string | null;
  model: string | null;
  accountId: string | null;
  apiKey: string | null;
}): Snapshot {
  const model = key.model?.trim() ?? "";
  if (!model) {
    throw new ChatRequestError("This AI setting is missing a model.");
  }
  if (key.source === "ollama" && !key.url) {
    throw new ChatRequestError("This Ollama setting is missing a URL.");
  }
  if (key.source === "cloudflare" && (!key.accountId || !key.apiKey)) {
    throw new ChatRequestError(
      "This Cloudflare setting is missing an account ID or API key.",
    );
  }
  return {
    aiSource: key.source,
    aiModel: model,
    aiUrl: key.url,
    aiAccountId: key.accountId,
    aiApiKey: key.apiKey,
  };
}

async function configFromSnapshot(row: {
  aiSource: AiKeySource | null;
  aiModel: string | null;
  aiUrl: string | null;
  aiAccountId: string | null;
  aiApiKey: string | null;
}): Promise<AiProviderConfig> {
  if (!row.aiSource || !row.aiModel) {
    throw new ChatRequestError(
      "This chat has no AI provider locked. Start a new chat.",
    );
  }
  return {
    source: row.aiSource as AiProviderId,
    model: row.aiModel,
    url: row.aiUrl ? await decryptChatText(row.aiUrl) : null,
    accountId: row.aiAccountId,
    apiKey: row.aiApiKey ? await decryptChatText(row.aiApiKey) : null,
  };
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) {
    return options;
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const caller = await requireCaller(req);
  if (isCallerError(caller)) {
    return caller.response;
  }
  const { supabase } = caller;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const homeId = body.homeId;
  const message = String(body.message ?? "").trim();
  const incomingPromptRaw = String(body.systemPrompt ?? "").trim();
  const incomingPrompt = normalizeSystemPrompt(incomingPromptRaw);
  const incomingSource = String(body.aiSource ?? "").trim();
  let conversationId = String(body.conversationId ?? "").trim();

  if (!isUuid(homeId)) {
    return errorResponse("Invalid home.", 400);
  }
  if (conversationId && !isUuid(conversationId)) {
    return errorResponse("Invalid chat.", 400);
  }
  if (!message) {
    return errorResponse("Message is required.", 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return errorResponse("Message is too long.", 400);
  }
  if (incomingPromptRaw.length > MAX_SYSTEM_PROMPT_LENGTH) {
    return errorResponse("Instructions are too long.", 400);
  }

  try {
    // RLS would hide the rows anyway, but an explicit check turns "no rows" into
    // a 403 the UI can explain.
    const { data: isMember, error: memberError } = await supabase.rpc(
      "is_home_member",
      { p_home_id: homeId },
    );
    if (memberError) {
      throw new Error("MEMBERSHIP_CHECK_FAILED");
    }
    if (!isMember) {
      return errorResponse("Forbidden", 403);
    }

    const loadKeySnapshot = async (source: string): Promise<Snapshot> => {
      if (!isAiKeySource(source)) {
        throw new ChatRequestError("Choose an AI provider before sending.");
      }
      const { data } = await supabase
        .from("user_ai_key")
        .select("source, url, model, accountId, apiKey")
        .eq("source", source)
        .limit(1);

      const key = data?.[0];
      if (!key) {
        throw new ChatRequestError(
          "That AI setting was not found. Add it under AI setting.",
        );
      }
      return snapshotFromKey(key);
    };

    const titlePlain = titleFromMessage(message);
    const titleCipher = await encryptChatText(titlePlain);
    const promptCipher = await encryptChatText(incomingPrompt);
    let systemPromptPlain = incomingPrompt;
    let providerConfig: AiProviderConfig;

    if (!conversationId) {
      const snapshot = await loadKeySnapshot(incomingSource);
      const { data, error } = await supabase
        .from("chat_conversation")
        .insert({
          homeId,
          title: titleCipher,
          systemPrompt: promptCipher,
          ...snapshot,
        })
        .select("id, aiSource, aiModel, aiUrl, aiAccountId, aiApiKey")
        .limit(1);

      const created = data?.[0];
      if (error || !created) {
        throw new Error("CREATE_FAILED");
      }
      conversationId = created.id;
      providerConfig = await configFromSnapshot(created);
    } else {
      const { data } = await supabase
        .from("chat_conversation")
        .select(
          "id, title, systemPrompt, aiSource, aiModel, aiUrl, aiAccountId, aiApiKey",
        )
        .eq("id", conversationId)
        .eq("homeId", homeId)
        .limit(1);

      const existing = data?.[0];
      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      // A chat keeps its placeholder name until the first real message.
      if ((await decryptChatText(existing.title)) === "New chat") {
        updates.title = titleCipher;
      }

      if (existing.systemPrompt) {
        systemPromptPlain =
          (await decryptChatText(existing.systemPrompt)) ||
          DEFAULT_SYSTEM_PROMPT;
      } else {
        updates.systemPrompt = promptCipher;
      }

      if (existing.aiSource && existing.aiModel) {
        providerConfig = await configFromSnapshot(existing);
      } else {
        // A conversation locks its provider on first send. If messages already
        // exist without one, the history was written under a provider we can no
        // longer identify, so we refuse rather than silently switch models.
        const { data: prior } = await supabase
          .from("chat_message")
          .select("id")
          .eq("conversationId", conversationId)
          .eq("homeId", homeId)
          .limit(1);

        if (prior && prior.length > 0) {
          throw new ChatRequestError(
            "This chat has no AI provider locked. Start a new chat.",
          );
        }

        const snapshot = await loadKeySnapshot(incomingSource);
        Object.assign(updates, snapshot);
        providerConfig = await configFromSnapshot(snapshot);
      }

      await supabase
        .from("chat_conversation")
        .update(updates)
        .eq("id", conversationId);
    }

    const { data: userMsgRows, error: userMsgError } = await supabase
      .from("chat_message")
      .insert({
        conversationId,
        homeId,
        role: "user",
        content: await encryptChatText(message),
      })
      .select("id")
      .limit(1);

    const userMessageId = userMsgRows?.[0]?.id;
    if (userMsgError || !userMessageId) {
      throw new Error("MESSAGE_INSERT_FAILED");
    }

    const { data: historyRows } = await supabase
      .from("chat_message")
      .select("role, content")
      .eq("conversationId", conversationId)
      .eq("homeId", homeId)
      .order("createdAt", { ascending: true });

    const history: AiChatMessage[] = await Promise.all(
      (historyRows ?? [])
        .filter((row) => row.role !== "system")
        .map(async (row) => ({
          role: row.role as AiChatMessage["role"],
          content: await decryptChatText(row.content),
        })),
    );

    const provider = createAiProviderFromConfig(providerConfig);
    const encoder = new TextEncoder();
    const finalConversationId = conversationId;
    const assistantMessageId = crypto.randomUUID();

    let assistantText = "";
    let persisted = false;
    let clientGone = false;

    const persist = async () => {
      if (persisted) {
        return;
      }
      persisted = true;

      await supabase.from("chat_message").insert({
        id: assistantMessageId,
        conversationId: finalConversationId,
        homeId,
        role: "assistant",
        content: await encryptChatText(assistantText || "(No response)"),
      });

      // The BEFORE UPDATE trigger overwrites this with now(); the column is
      // named only so the statement has something to set.
      await supabase
        .from("chat_conversation")
        .update({ updatedAt: new Date().toISOString() })
        .eq("id", finalConversationId);
    };

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          if (clientGone) {
            return;
          }
          try {
            controller.enqueue(encoder.encode(sseEncode(event, data)));
          } catch {
            // The reader is gone. Keep draining the provider so the reply is
            // still saved, but stop trying to write to a closed stream.
            clientGone = true;
          }
        };

        send("meta", {
          conversationId: finalConversationId,
          userMessageId,
          provider: provider.id,
          model: provider.model,
        });

        try {
          for await (const delta of provider.streamChat({
            messages: [
              { role: "system", content: systemPromptPlain },
              ...history,
            ],
          })) {
            assistantText += delta;
            send("delta", { text: delta });
          }

          await persist();

          send("done", {
            conversationId: finalConversationId,
            assistantMessageId,
          });
        } catch (err) {
          // Save whatever arrived before the failure rather than dropping a
          // partial answer.
          if (assistantText) {
            await persist().catch(() => {});
          }
          send("error", {
            error: err instanceof Error ? err.message : "Provider request failed",
          });
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed by the cancel path.
          }
        }
      },

      // Fires when the client disconnects, which on mobile means the app was
      // backgrounded or the network dropped. waitUntil keeps the isolate alive
      // long enough to finish the write.
      cancel() {
        clientGone = true;
        EdgeRuntime.waitUntil(persist().catch(() => {}));
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof ChatRequestError) {
      return errorResponse(err.message, err.status);
    }
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return errorResponse("Chat not found", 404);
    }
    return errorResponse("Could not start chat", 500);
  }
});

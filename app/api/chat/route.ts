import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import {
  createAiProviderFromConfig,
  type AiChatMessage,
  type AiProviderConfig,
} from "../../../lib/ai";
import { decryptChatText, encryptChatText } from "../../../lib/chat-crypto";
import {
  DEFAULT_SYSTEM_PROMPT,
  MAX_SYSTEM_PROMPT_LENGTH,
  normalizeSystemPrompt,
} from "../../../lib/chat-prompt";
import { isValidHomeId, normalizeHomeId } from "../../../lib/home-id";
import { AI_KEY_SOURCES, type AiKeySource } from "../../../lib/types";
import { withRls } from "../../../src/db/rls";
import {
  chatConversations,
  chatMessages,
  homeMembers,
  userAiKeys,
} from "../../../src/db/schema";

export const runtime = "nodejs";

type ChatBody = {
  homeId?: string;
  conversationId?: string;
  message?: string;
  systemPrompt?: string;
  aiSource?: string;
};

class ChatRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isAiKeySource(value: string): value is AiKeySource {
  return (AI_KEY_SOURCES as readonly string[]).includes(value);
}

function titleFromMessage(message: string) {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 48) {
    return cleaned || "New chat";
  }
  return `${cleaned.slice(0, 45)}…`;
}

function sseEncode(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function snapshotFromKey(key: {
  source: AiKeySource;
  url: string | null;
  model: string | null;
  accountId: string | null;
  apiKey: string | null;
}) {
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

function configFromSnapshot(row: {
  aiSource: AiKeySource | null;
  aiModel: string | null;
  aiUrl: string | null;
  aiAccountId: string | null;
  aiApiKey: string | null;
}): AiProviderConfig {
  if (!row.aiSource || !row.aiModel) {
    throw new ChatRequestError(
      "This chat has no AI provider locked. Start a new chat.",
    );
  }
  return {
    source: row.aiSource,
    model: row.aiModel,
    url: row.aiUrl ? decryptChatText(row.aiUrl) : null,
    accountId: row.aiAccountId,
    apiKey: row.aiApiKey ? decryptChatText(row.aiApiKey) : null,
  };
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const homeId = normalizeHomeId(String(body.homeId ?? ""));
  const message = String(body.message ?? "").trim();
  let conversationId = String(body.conversationId ?? "").trim();
  const incomingPromptRaw = String(body.systemPrompt ?? "").trim();
  const incomingPrompt = normalizeSystemPrompt(incomingPromptRaw);
  const incomingSource = String(body.aiSource ?? "").trim();

  if (!isValidHomeId(homeId)) {
    return NextResponse.json({ error: "Invalid home." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > 8000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }
  if (incomingPromptRaw.length > MAX_SYSTEM_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: "Instructions are too long." },
      { status: 400 },
    );
  }

  try {
    const prepared = await withRls(userId, async (tx) => {
      const ownerUserId = userId;
      const [membership] = await tx
        .select({ homeId: homeMembers.homeId })
        .from(homeMembers)
        .where(
          and(eq(homeMembers.homeId, homeId), eq(homeMembers.userId, userId)),
        )
        .limit(1);

      if (!membership) {
        throw new Error("FORBIDDEN");
      }

      async function loadKeySnapshot(source: string) {
        if (!isAiKeySource(source)) {
          throw new ChatRequestError("Choose an AI provider before sending.");
        }
        const [key] = await tx
          .select({
            source: userAiKeys.source,
            url: userAiKeys.url,
            model: userAiKeys.model,
            accountId: userAiKeys.accountId,
            apiKey: userAiKeys.apiKey,
          })
          .from(userAiKeys)
          .where(
            and(
              eq(userAiKeys.userId, ownerUserId),
              eq(userAiKeys.source, source),
            ),
          )
          .limit(1);
        if (!key) {
          throw new ChatRequestError(
            "That AI setting was not found. Add it under AI setting.",
          );
        }
        return snapshotFromKey(key);
      }

      const titlePlain = titleFromMessage(message);
      const titleCipher = encryptChatText(titlePlain);
      const promptCipher = encryptChatText(incomingPrompt);
      let systemPromptPlain = incomingPrompt;
      let providerConfig: AiProviderConfig;

      if (!conversationId) {
        const snapshot = await loadKeySnapshot(incomingSource);
        const [created] = await tx
          .insert(chatConversations)
          .values({
            homeId,
            title: titleCipher,
            systemPrompt: promptCipher,
            createdByUserId: userId,
            ...snapshot,
          })
          .returning({
            id: chatConversations.id,
            aiSource: chatConversations.aiSource,
            aiModel: chatConversations.aiModel,
            aiUrl: chatConversations.aiUrl,
            aiAccountId: chatConversations.aiAccountId,
            aiApiKey: chatConversations.aiApiKey,
          });
        conversationId = created.id;
        providerConfig = configFromSnapshot(created);
      } else {
        const [existing] = await tx
          .select({
            id: chatConversations.id,
            title: chatConversations.title,
            systemPrompt: chatConversations.systemPrompt,
            aiSource: chatConversations.aiSource,
            aiModel: chatConversations.aiModel,
            aiUrl: chatConversations.aiUrl,
            aiAccountId: chatConversations.aiAccountId,
            aiApiKey: chatConversations.aiApiKey,
          })
          .from(chatConversations)
          .where(
            and(
              eq(chatConversations.id, conversationId),
              eq(chatConversations.homeId, homeId),
            ),
          )
          .limit(1);

        if (!existing) {
          throw new Error("NOT_FOUND");
        }

        const updates: {
          title?: string;
          systemPrompt?: string;
          aiSource?: AiKeySource;
          aiModel?: string;
          aiUrl?: string | null;
          aiAccountId?: string | null;
          aiApiKey?: string | null;
          updatedAt: Date;
        } = { updatedAt: new Date() };

        if (decryptChatText(existing.title) === "New chat") {
          updates.title = titleCipher;
        }

        if (existing.systemPrompt) {
          systemPromptPlain =
            decryptChatText(existing.systemPrompt) || DEFAULT_SYSTEM_PROMPT;
        } else {
          updates.systemPrompt = promptCipher;
        }

        if (existing.aiSource && existing.aiModel) {
          providerConfig = configFromSnapshot(existing);
        } else {
          const [priorMessage] = await tx
            .select({ id: chatMessages.id })
            .from(chatMessages)
            .where(
              and(
                eq(chatMessages.conversationId, conversationId),
                eq(chatMessages.homeId, homeId),
              ),
            )
            .limit(1);
          if (priorMessage) {
            throw new ChatRequestError(
              "This chat has no AI provider locked. Start a new chat.",
            );
          }
          const snapshot = await loadKeySnapshot(incomingSource);
          updates.aiSource = snapshot.aiSource;
          updates.aiModel = snapshot.aiModel;
          updates.aiUrl = snapshot.aiUrl;
          updates.aiAccountId = snapshot.aiAccountId;
          updates.aiApiKey = snapshot.aiApiKey;
          providerConfig = configFromSnapshot(snapshot);
        }

        await tx
          .update(chatConversations)
          .set(updates)
          .where(eq(chatConversations.id, conversationId));
      }

      const [userMsg] = await tx
        .insert(chatMessages)
        .values({
          conversationId,
          homeId,
          role: "user",
          content: encryptChatText(message),
        })
        .returning({
          id: chatMessages.id,
          role: chatMessages.role,
          content: chatMessages.content,
        });

      const history = await tx
        .select({
          role: chatMessages.role,
          content: chatMessages.content,
        })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.conversationId, conversationId),
            eq(chatMessages.homeId, homeId),
          ),
        )
        .orderBy(asc(chatMessages.createdAt));

      return {
        conversationId,
        userMessageId: userMsg.id,
        systemPrompt: systemPromptPlain,
        providerConfig,
        history: history
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role,
            content: decryptChatText(m.content),
          })) as AiChatMessage[],
      };
    });

    const provider = createAiProviderFromConfig(prepared.providerConfig);
    const encoder = new TextEncoder();
    let assistantText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEncode(event, data)));
        };

        send("meta", {
          conversationId: prepared.conversationId,
          userMessageId: prepared.userMessageId,
          provider: provider.id,
          model: provider.model,
        });

        try {
          for await (const delta of provider.streamChat({
            messages: [
              {
                role: "system",
                content: prepared.systemPrompt,
              },
              ...prepared.history,
            ],
          })) {
            assistantText += delta;
            send("delta", { text: delta });
          }

          const assistantMessage = await withRls(userId, async (tx) => {
            const [row] = await tx
              .insert(chatMessages)
              .values({
                conversationId: prepared.conversationId,
                homeId,
                role: "assistant",
                content: encryptChatText(assistantText || "(No response)"),
              })
              .returning({
                id: chatMessages.id,
                content: chatMessages.content,
              });

            await tx
              .update(chatConversations)
              .set({ updatedAt: new Date() })
              .where(eq(chatConversations.id, prepared.conversationId));

            return row;
          });

          send("done", {
            conversationId: prepared.conversationId,
            assistantMessageId: assistantMessage.id,
          });
        } catch (err) {
          const detail =
            err instanceof Error ? err.message : "Provider request failed";
          send("error", { error: detail });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof ChatRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not start chat" }, { status: 500 });
  }
}

import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getAiProvider, type AiChatMessage } from "../../../lib/ai";
import { isValidHomeId, normalizeHomeId } from "../../../lib/home-id";
import { withRls } from "../../../src/db/rls";
import {
  chatConversations,
  chatMessages,
  homeMembers,
} from "../../../src/db/schema";

export const runtime = "nodejs";

type ChatBody = {
  homeId?: string;
  conversationId?: string;
  message?: string;
};

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

  if (!isValidHomeId(homeId)) {
    return NextResponse.json({ error: "Invalid home." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > 8000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  try {
    const prepared = await withRls(userId, async (tx) => {
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

      if (!conversationId) {
        const [created] = await tx
          .insert(chatConversations)
          .values({
            homeId,
            title: titleFromMessage(message),
            createdByUserId: userId,
          })
          .returning({ id: chatConversations.id });
        conversationId = created.id;
      } else {
        const [existing] = await tx
          .select({ id: chatConversations.id, title: chatConversations.title })
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

        if (existing.title === "New chat") {
          await tx
            .update(chatConversations)
            .set({
              title: titleFromMessage(message),
              updatedAt: new Date(),
            })
            .where(eq(chatConversations.id, conversationId));
        } else {
          await tx
            .update(chatConversations)
            .set({ updatedAt: new Date() })
            .where(eq(chatConversations.id, conversationId));
        }
      }

      const [userMsg] = await tx
        .insert(chatMessages)
        .values({
          conversationId,
          homeId,
          role: "user",
          content: message,
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
        history: history.filter((m) => m.role !== "system") as AiChatMessage[],
      };
    });

    const provider = getAiProvider();
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
                content:
                  "You are a helpful household assistant for HomeCore. Be concise, practical, and friendly.",
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
                content: assistantText || "(No response)",
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
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not start chat" }, { status: 500 });
  }
}

"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { decryptChatText } from "../../lib/chat-crypto";
import { isValidHomeId, normalizeHomeId } from "../../lib/home-id";
import { withRls } from "../../src/db/rls";
import {
  chatConversations,
  chatMessages,
  homeMembers,
} from "../../src/db/schema";

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

export type ChatConversationSummary = {
  id: string;
  homeId: string;
  title: string;
  updatedAt: Date;
};

export type ChatMessageRow = {
  id: string;
  conversationId: string;
  homeId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
};

export async function getConversationsForHome(userId: string, homeId: string) {
  const rows = await withRls(userId, async (tx) =>
    tx
      .select({
        id: chatConversations.id,
        homeId: chatConversations.homeId,
        title: chatConversations.title,
        updatedAt: chatConversations.updatedAt,
      })
      .from(chatConversations)
      .where(eq(chatConversations.homeId, homeId))
      .orderBy(desc(chatConversations.updatedAt)),
  );

  return rows.map((row) => ({
    ...row,
    title: decryptChatText(row.title),
  }));
}

export async function getConversationForMember(
  userId: string,
  homeId: string,
  conversationId: string,
) {
  return withRls(userId, async (tx) => {
    const [row] = await tx
      .select({
        id: chatConversations.id,
        homeId: chatConversations.homeId,
        title: chatConversations.title,
        systemPrompt: chatConversations.systemPrompt,
        aiSource: chatConversations.aiSource,
        aiModel: chatConversations.aiModel,
        updatedAt: chatConversations.updatedAt,
      })
      .from(chatConversations)
      .where(
        and(
          eq(chatConversations.id, conversationId),
          eq(chatConversations.homeId, homeId),
        ),
      )
      .limit(1);
    if (!row) {
      return null;
    }
    return {
      ...row,
      title: decryptChatText(row.title),
      systemPrompt: row.systemPrompt
        ? decryptChatText(row.systemPrompt)
        : null,
      aiSource: row.aiSource,
      aiModel: row.aiModel,
    };
  });
}

export async function getMessagesForConversation(
  userId: string,
  homeId: string,
  conversationId: string,
) {
  const rows = await withRls(userId, async (tx) =>
    tx
      .select({
        id: chatMessages.id,
        conversationId: chatMessages.conversationId,
        homeId: chatMessages.homeId,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.conversationId, conversationId),
          eq(chatMessages.homeId, homeId),
        ),
      )
      .orderBy(asc(chatMessages.createdAt)),
  );

  return rows.map((row) => ({
    ...row,
    content: decryptChatText(row.content),
  }));
}

export async function createConversation(
  homeId: string,
): Promise<{ error: string } | { id: string }> {
  const userId = await requireUserId();
  const normalized = normalizeHomeId(homeId);
  if (!isValidHomeId(normalized)) {
    return { error: "Invalid home." };
  }

  try {
    const created = await withRls(userId, async (tx) => {
      const [membership] = await tx
        .select({ homeId: homeMembers.homeId })
        .from(homeMembers)
        .where(
          and(
            eq(homeMembers.homeId, normalized),
            eq(homeMembers.userId, userId),
          ),
        )
        .limit(1);

      if (!membership) {
        throw new Error("Not a member");
      }

      const [row] = await tx
        .insert(chatConversations)
        .values({
          homeId: normalized,
          title: "New chat",
          createdByUserId: userId,
        })
        .returning({ id: chatConversations.id });

      return row;
    });

    if (!created?.id) {
      return { error: "Could not create chat." };
    }
    return { id: created.id };
  } catch {
    return { error: "Could not create chat." };
  }
}

export async function deleteConversation(
  homeId: string,
  conversationId: string,
): Promise<{ error: string } | { ok: true }> {
  const userId = await requireUserId();
  const normalized = normalizeHomeId(homeId);
  if (!isValidHomeId(normalized)) {
    return { error: "Invalid home." };
  }
  if (!conversationId.trim()) {
    return { error: "Invalid chat." };
  }

  try {
    const deleted = await withRls(userId, async (tx) => {
      const [membership] = await tx
        .select({ homeId: homeMembers.homeId })
        .from(homeMembers)
        .where(
          and(
            eq(homeMembers.homeId, normalized),
            eq(homeMembers.userId, userId),
          ),
        )
        .limit(1);

      if (!membership) {
        throw new Error("Not a member");
      }

      const removed = await tx
        .delete(chatConversations)
        .where(
          and(
            eq(chatConversations.id, conversationId),
            eq(chatConversations.homeId, normalized),
          ),
        )
        .returning({ id: chatConversations.id });

      return removed[0] ?? null;
    });

    if (!deleted) {
      return { error: "Chat not found." };
    }
    return { ok: true };
  } catch {
    return { error: "Could not delete chat." };
  }
}

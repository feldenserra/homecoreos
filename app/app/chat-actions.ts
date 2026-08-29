"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
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
  return withRls(userId, async (tx) =>
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
    return row ?? null;
  });
}

export async function getMessagesForConversation(
  userId: string,
  homeId: string,
  conversationId: string,
) {
  return withRls(userId, async (tx) =>
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

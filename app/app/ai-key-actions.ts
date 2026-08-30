"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { decryptChatText, encryptChatText } from "../../lib/chat-crypto";
import {
  AI_KEY_SOURCES,
  type AiKeySource,
} from "../../lib/types";
import { withRls } from "../../src/db/rls";
import { userAiKeys } from "../../src/db/schema";

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

function isAiKeySource(value: string): value is AiKeySource {
  return (AI_KEY_SOURCES as readonly string[]).includes(value);
}

export type AiKeyListItem = {
  id: string;
  source: AiKeySource;
  url: string | null;
  model: string | null;
  accountId: string | null;
  hasApiKey: boolean;
};

export type SaveAiKeyInput = {
  source: AiKeySource;
  url?: string;
  model?: string;
  accountId?: string;
  apiKey?: string;
};

export async function getAiKeysForUser(): Promise<
  { error: string } | { keys: AiKeyListItem[] }
> {
  const userId = await requireUserId();

  try {
    const rows = await withRls(userId, async (tx) =>
      tx
        .select({
          id: userAiKeys.id,
          source: userAiKeys.source,
          url: userAiKeys.url,
          model: userAiKeys.model,
          accountId: userAiKeys.accountId,
          apiKey: userAiKeys.apiKey,
        })
        .from(userAiKeys)
        .where(eq(userAiKeys.userId, userId)),
    );

    return {
      keys: rows.map((row) => ({
        id: row.id,
        source: row.source,
        url: row.url ? decryptChatText(row.url) : null,
        model: row.model,
        accountId: row.accountId,
        hasApiKey: Boolean(row.apiKey),
      })),
    };
  } catch {
    return { error: "Could not load AI settings." };
  }
}

export async function saveAiKey(
  input: SaveAiKeyInput,
): Promise<{ error: string } | { ok: true }> {
  const userId = await requireUserId();
  const source = input.source;

  if (!isAiKeySource(source)) {
    return { error: "Invalid source." };
  }

  try {
    return await withRls(userId, async (tx) => {
      const [existing] = await tx
        .select({
          id: userAiKeys.id,
          apiKey: userAiKeys.apiKey,
        })
        .from(userAiKeys)
        .where(
          and(eq(userAiKeys.userId, userId), eq(userAiKeys.source, source)),
        )
        .limit(1);

      if (source === "ollama") {
        const url = input.url?.trim() ?? "";
        const model = input.model?.trim() ?? "";
        if (!url || !model) {
          return { error: "URL and model are required." };
        }

        const values = {
          url: encryptChatText(url),
          model,
          accountId: null,
          apiKey: null,
          updatedAt: new Date(),
        };

        if (existing) {
          await tx
            .update(userAiKeys)
            .set(values)
            .where(eq(userAiKeys.id, existing.id));
        } else {
          await tx.insert(userAiKeys).values({
            userId,
            source,
            ...values,
          });
        }

        return { ok: true as const };
      }

      const accountId = input.accountId?.trim() ?? "";
      const model = input.model?.trim() ?? "";
      const apiKey = input.apiKey?.trim() ?? "";
      if (!accountId || !model) {
        return { error: "Account ID and model are required." };
      }
      if (!existing && !apiKey) {
        return { error: "API key is required." };
      }

      const values = {
        url: null,
        model,
        accountId,
        apiKey: apiKey ? encryptChatText(apiKey) : existing!.apiKey,
        updatedAt: new Date(),
      };

      if (existing) {
        await tx
          .update(userAiKeys)
          .set(values)
          .where(eq(userAiKeys.id, existing.id));
      } else {
        await tx.insert(userAiKeys).values({
          userId,
          source,
          ...values,
        });
      }

      return { ok: true as const };
    });
  } catch {
    return { error: "Could not save AI settings." };
  }
}

export async function deleteAiKey(
  source: AiKeySource,
): Promise<{ error: string } | { ok: true }> {
  const userId = await requireUserId();

  if (!isAiKeySource(source)) {
    return { error: "Invalid source." };
  }

  try {
    const deleted = await withRls(userId, async (tx) => {
      const removed = await tx
        .delete(userAiKeys)
        .where(
          and(eq(userAiKeys.userId, userId), eq(userAiKeys.source, source)),
        )
        .returning({ id: userAiKeys.id });
      return removed[0] ?? null;
    });

    if (!deleted) {
      return { error: "AI setting not found." };
    }
    return { ok: true };
  } catch {
    return { error: "Could not delete AI setting." };
  }
}

/**
 * Chat conversation and message reads. Replaces app/app/chat-actions.ts.
 *
 *   GET    /conversations?homeId=...                       list a home's chats
 *   GET    /conversations?homeId=...&conversationId=...     one chat + messages
 *   POST   /conversations   { homeId }                      create
 *   DELETE /conversations?homeId=...&conversationId=...     delete
 *
 * Reads cannot be direct client queries: titles, system prompts and message
 * bodies are encrypted at rest, and the key stays server-side.
 *
 * Membership is not re-checked in code the way the server actions did — RLS
 * enforces it on every statement, and the caller's own JWT is what these
 * queries run under. A non-member simply sees nothing.
 */
import { decryptChatText, decryptOptional } from "../_shared/crypto.ts";
import {
  errorResponse,
  isCallerError,
  jsonResponse,
  preflight,
  requireCaller,
} from "../_shared/http.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) {
    return options;
  }

  const caller = await requireCaller(req);
  if (isCallerError(caller)) {
    return caller.response;
  }
  const { supabase } = caller;

  const url = new URL(req.url);

  if (req.method === "GET") {
    const homeId = url.searchParams.get("homeId");
    const conversationId = url.searchParams.get("conversationId");

    if (!isUuid(homeId)) {
      return errorResponse("Invalid home.", 400);
    }

    if (conversationId === null) {
      const { data, error } = await supabase
        .from("chat_conversation")
        .select("id, homeId, title, updatedAt")
        .eq("homeId", homeId)
        .order("updatedAt", { ascending: false });

      if (error) {
        return errorResponse("Could not load chats.", 500);
      }

      const conversations = await Promise.all(
        data.map(async (row) => ({
          ...row,
          title: await decryptChatText(row.title),
        })),
      );

      return jsonResponse({ conversations });
    }

    if (!isUuid(conversationId)) {
      return errorResponse("Invalid chat.", 400);
    }

    // aiUrl and aiApiKey are deliberately not selected, matching
    // getConversationForMember: the client has no use for them and no way to
    // read them.
    const { data: rows, error } = await supabase
      .from("chat_conversation")
      .select("id, homeId, title, systemPrompt, aiSource, aiModel, updatedAt")
      .eq("id", conversationId)
      .eq("homeId", homeId)
      .limit(1);

    if (error) {
      return errorResponse("Could not load chat.", 500);
    }
    const row = rows?.[0];
    if (!row) {
      return errorResponse("Chat not found.", 404);
    }

    const { data: messageRows, error: messagesError } = await supabase
      .from("chat_message")
      .select("id, conversationId, homeId, role, content, createdAt")
      .eq("conversationId", conversationId)
      .eq("homeId", homeId)
      .order("createdAt", { ascending: true });

    if (messagesError) {
      return errorResponse("Could not load messages.", 500);
    }

    const messages = await Promise.all(
      messageRows.map(async (message) => ({
        ...message,
        content: await decryptChatText(message.content),
      })),
    );

    return jsonResponse({
      conversation: {
        ...row,
        title: await decryptChatText(row.title),
        systemPrompt: await decryptOptional(row.systemPrompt),
      },
      messages,
    });
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid request.", 400);
    }

    if (!isUuid(body.homeId)) {
      return errorResponse("Invalid home.", 400);
    }

    // `title` keeps its plaintext default here, exactly as createConversation
    // did; it is encrypted once the first message names the chat.
    const { data, error } = await supabase
      .from("chat_conversation")
      .insert({ homeId: body.homeId })
      .select("id")
      .limit(1);

    if (error || !data?.[0]?.id) {
      return errorResponse("Could not create chat.", 500);
    }

    return jsonResponse({ id: data[0].id });
  }

  if (req.method === "DELETE") {
    const homeId = url.searchParams.get("homeId");
    const conversationId = url.searchParams.get("conversationId");

    if (!isUuid(homeId)) {
      return errorResponse("Invalid home.", 400);
    }
    if (!isUuid(conversationId)) {
      return errorResponse("Invalid chat.", 400);
    }

    const { data, error } = await supabase
      .from("chat_conversation")
      .delete()
      .eq("id", conversationId)
      .eq("homeId", homeId)
      .select("id");

    if (error) {
      return errorResponse("Could not delete chat.", 500);
    }
    if (!data || data.length === 0) {
      return errorResponse("Chat not found.", 404);
    }

    return jsonResponse({ ok: true });
  }

  return errorResponse("Method not allowed", 405);
});

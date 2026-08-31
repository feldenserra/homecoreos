/**
 * Per-user AI provider credentials. Replaces app/app/ai-key-actions.ts.
 *
 *   GET    /ai-keys              list configured providers
 *   POST   /ai-keys              create or update one
 *   DELETE /ai-keys?source=...   remove one
 *
 * This lives in an Edge Function rather than being a direct client query
 * because the Ollama URL and the Cloudflare token are encrypted at rest and the
 * key must not ship in the app bundle.
 *
 * As in the original, the API key is never returned — only `hasApiKey`.
 */
import { assertSafeProviderUrl } from "../_shared/ai.ts";
import {
  decryptOptional,
  encryptChatText,
  encryptOptional,
} from "../_shared/crypto.ts";
import {
  errorResponse,
  isCallerError,
  jsonResponse,
  preflight,
  requireCaller,
} from "../_shared/http.ts";

const AI_KEY_SOURCES = ["ollama", "cloudflare"] as const;
type AiKeySource = (typeof AI_KEY_SOURCES)[number];

function isAiKeySource(value: unknown): value is AiKeySource {
  return (
    typeof value === "string" &&
    (AI_KEY_SOURCES as readonly string[]).includes(value)
  );
}

type StoredRow = {
  id: string;
  source: AiKeySource;
  url: string | null;
  model: string | null;
  accountId: string | null;
  apiKey: string | null;
};

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

  // RLS scopes every one of these to the caller's own rows; there is no
  // user id filter in the queries below because there does not need to be.
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("user_ai_key")
      .select("id, source, url, model, accountId, apiKey");

    if (error) {
      return errorResponse("Could not load AI settings.", 500);
    }

    const keys = await Promise.all(
      (data as StoredRow[]).map(async (row) => ({
        id: row.id,
        source: row.source,
        url: await decryptOptional(row.url),
        model: row.model,
        accountId: row.accountId,
        hasApiKey: Boolean(row.apiKey),
      })),
    );

    return jsonResponse({ keys });
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid request.", 400);
    }

    const source = body.source;
    if (!isAiKeySource(source)) {
      return errorResponse("Invalid source.", 400);
    }

    const asText = (value: unknown) =>
      typeof value === "string" ? value.trim() : "";

    const model = asText(body.model);

    const { data: existingRows, error: existingError } = await supabase
      .from("user_ai_key")
      .select("id, apiKey")
      .eq("source", source)
      .limit(1);

    if (existingError) {
      return errorResponse("Could not save AI settings.", 500);
    }
    const existing = existingRows?.[0] ?? null;

    let values: Record<string, unknown>;

    if (source === "ollama") {
      const url = asText(body.url);
      if (!url || !model) {
        return errorResponse("URL and model are required.", 400);
      }

      // Validated here as well as at stream time so a URL that can never work
      // is rejected while the user is looking at the settings form.
      try {
        assertSafeProviderUrl(
          url.replace(/\/+$/, "").endsWith("/v1") ? url : `${url}/v1`,
        );
      } catch (err) {
        return errorResponse(
          err instanceof Error ? err.message : "Invalid Ollama URL.",
          400,
        );
      }

      values = {
        source,
        url: await encryptChatText(url),
        model,
        accountId: null,
        apiKey: null,
      };
    } else {
      const accountId = asText(body.accountId);
      const apiKey = asText(body.apiKey);

      if (!accountId || !model) {
        return errorResponse("Account ID and model are required.", 400);
      }
      // An existing row keeps its stored key when the field is left blank, so
      // editing the model does not require re-entering the token.
      if (!existing && !apiKey) {
        return errorResponse("API key is required.", 400);
      }

      values = {
        source,
        url: null,
        model,
        accountId,
        apiKey: apiKey ? await encryptOptional(apiKey) : existing?.apiKey,
      };
    }

    const { error: writeError } = existing
      ? await supabase.from("user_ai_key").update(values).eq("id", existing.id)
      : await supabase.from("user_ai_key").insert(values);

    if (writeError) {
      return errorResponse("Could not save AI settings.", 500);
    }

    return jsonResponse({ ok: true });
  }

  if (req.method === "DELETE") {
    const source = new URL(req.url).searchParams.get("source");
    if (!isAiKeySource(source)) {
      return errorResponse("Invalid source.", 400);
    }

    const { data, error } = await supabase
      .from("user_ai_key")
      .delete()
      .eq("source", source)
      .select("id");

    if (error) {
      return errorResponse("Could not delete AI setting.", 500);
    }
    if (!data || data.length === 0) {
      return errorResponse("AI setting not found.", 404);
    }

    return jsonResponse({ ok: true });
  }

  return errorResponse("Method not allowed", 405);
});

// Version pinned in supabase/functions/deno.json.
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

export const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-max-age": "86400",
};

export function preflight(req: Request): Response | null {
  return req.method === "OPTIONS"
    ? new Response(null, { status: 204, headers: CORS_HEADERS })
    : null;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * A Supabase client acting as the caller.
 *
 * The caller's JWT is forwarded rather than using the service-role key, so
 * every query these functions make is still filtered by RLS. The encryption key
 * is the only privilege the function holds that the client does not — the
 * function is not a way around the household boundary.
 */
export function clientForRequest(req: Request): SupabaseClient {
  const authorization = req.headers.get("Authorization") ?? "";

  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export type Caller = {
  supabase: SupabaseClient;
  user: User;
};

/**
 * Resolves the caller, or returns the 401 to send back.
 *
 * `verify_jwt` in config.toml already rejects unauthenticated requests; this
 * additionally gives us the user id without trusting anything client-supplied.
 */
export async function requireCaller(
  req: Request,
): Promise<Caller | { response: Response }> {
  const supabase = clientForRequest(req);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return { response: errorResponse("Unauthorized", 401) };
  }

  return { supabase, user: data.user };
}

export function isCallerError(
  value: Caller | { response: Response },
): value is { response: Response } {
  return "response" in value;
}

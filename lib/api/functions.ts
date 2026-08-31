import { FUNCTIONS_URL, SUPABASE_PUBLISHABLE_KEY, supabase } from "../supabase";

/**
 * Calls a Supabase Edge Function with the caller's session.
 *
 * `supabase.functions.invoke` would do for these, but a plain fetch keeps the
 * error shape identical to the streaming chat call, which cannot use invoke at
 * all (it buffers the body).
 */

export async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("You are signed out. Sign in again.");
  }
  return token;
}

/** Both headers are required: `apikey` for the gateway, bearer for identity. */
export async function functionHeaders(): Promise<Record<string, string>> {
  return {
    "content-type": "application/json",
    apikey: SUPABASE_PUBLISHABLE_KEY,
    authorization: `Bearer ${await accessToken()}`,
  };
}

export function functionUrl(path: string): string {
  return `${FUNCTIONS_URL}/${path}`;
}

export async function callFunction<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(functionUrl(path), {
    method: init.method ?? "GET",
    headers: await functionHeaders(),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ?? `Request failed with status ${response.status}.`,
    );
  }

  return payload as T;
}

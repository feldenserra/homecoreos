/**
 * Ollama / Cloudflare Workers AI streaming, ported from lib/ai/.
 *
 * Two deliberate departures from the original:
 *
 *  1. No `openai` SDK. lib/ai/providers/openai-compatible.ts used roughly one
 *     percent of it — a streaming chat completion — and cold start matters more
 *     in an Edge Function than it did in a long-lived Node server.
 *
 *  2. Provider URLs are validated before use. The Ollama base URL is
 *     user-supplied and was fetched server-side with no checks at all, which
 *     was an SSRF hole even in the Next.js version. On Supabase's egress it
 *     would additionally expose cloud metadata endpoints.
 *
 * A note on (2) that is a real behaviour change: a LAN Ollama
 * (http://192.168.1.x:11434) can no longer be used. The old deployment ran with
 * Docker host networking and could reach it; an Edge Function cannot route to
 * anyone's LAN regardless, so blocking private ranges removes an attack surface
 * without removing a capability that still worked. Publicly reachable Ollama
 * hosts and tunnels are unaffected.
 */

export type AiChatRole = "system" | "user" | "assistant";

export type AiChatMessage = {
  role: AiChatRole;
  content: string;
};

export type AiProviderId = "ollama" | "cloudflare";

export type AiProviderConfig = {
  source: AiProviderId;
  model: string;
  url?: string | null;
  accountId?: string | null;
  apiKey?: string | null;
};

export type AiProvider = {
  id: AiProviderId;
  model: string;
  streamChat: (input: {
    messages: AiChatMessage[];
    model?: string;
  }) => AsyncIterable<string>;
};

/** Fail rather than hang if a provider goes quiet mid-stream. */
const REQUEST_TIMEOUT_MS = 120_000;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "instance-data",
]);

const BLOCKED_IPV4 = [
  /^0\./, // "this network"
  /^10\./, // RFC1918
  /^127\./, // loopback
  /^169\.254\./, // link-local, incl. the 169.254.169.254 metadata endpoint
  /^192\.168\./, // RFC1918
  /^172\.(1[6-9]|2\d|3[01])\./, // RFC1918
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT, RFC6598
];

function isBlockedIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    h === "::1" ||
    h === "::" ||
    /^f[cd]/.test(h) || // fc00::/7 unique-local
    /^fe[89ab]/.test(h) // fe80::/10 link-local
  );
}

function insecureHostAllowlist(): Set<string> {
  const raw = Deno.env.get("AI_ALLOW_INSECURE_HOSTS") ?? "";
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Rejects URLs that should never be fetched from server-side code.
 *
 * DNS rebinding is still possible: Deno gives no way to pin the address a
 * hostname resolved to, so a name that passes here can point somewhere else by
 * the time the socket opens. An explicit host allowlist is the only complete
 * answer; this raises the cost of the easy version.
 */
export function assertSafeProviderUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Provider URL is not a valid URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Provider URL must use http or https.");
  }

  const host = url.hostname.toLowerCase();

  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost")
  ) {
    throw new Error("Provider URL host is not allowed.");
  }

  if (BLOCKED_IPV4.some((pattern) => pattern.test(host))) {
    throw new Error("Provider URL host is not allowed.");
  }

  if (host.includes(":") && isBlockedIpv6(host)) {
    throw new Error("Provider URL host is not allowed.");
  }

  if (url.protocol === "http:" && !insecureHostAllowlist().has(host)) {
    throw new Error(
      "Provider URL must use https (or be listed in AI_ALLOW_INSECURE_HOSTS).",
    );
  }

  return url;
}

/** Ollama exposes an OpenAI-compatible API under /v1. */
function ollamaBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function cloudflareBaseUrl(accountId: string): string {
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
    accountId,
  )}/ai/v1`;
}

async function* streamOpenAiCompatible(options: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: AiChatMessage[];
}): AsyncGenerator<string> {
  const response = await fetch(`${options.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
    }),
    // Never follow a redirect: it is the cheapest way to turn a vetted host
    // into an unvetted one.
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Provider returned ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ""}`,
    );
  }
  if (!response.body) {
    throw new Error("Provider returned an empty response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");

        if (!line.startsWith("data:")) {
          continue;
        }

        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) {
            yield delta;
          }
        } catch {
          // Keepalives and split frames are expected; skip anything unparseable.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Error messages are kept verbatim from lib/ai/factory.ts — the chat UI
 * surfaces them to the user as-is.
 */
export function createAiProviderFromConfig(
  config: AiProviderConfig,
): AiProvider {
  const model = config.model.trim();
  if (!model) {
    throw new Error("Model is required.");
  }

  if (config.source === "ollama") {
    const url = config.url?.trim() ?? "";
    if (!url) {
      throw new Error("Ollama URL is required.");
    }

    const baseUrl = ollamaBaseUrl(url);
    assertSafeProviderUrl(baseUrl);

    return {
      id: "ollama",
      model,
      streamChat: (input) =>
        streamOpenAiCompatible({
          baseUrl,
          // Ollama ignores the key but the OpenAI shape requires one.
          apiKey: "ollama",
          model: input.model ?? model,
          messages: input.messages,
        }),
    };
  }

  const accountId = config.accountId?.trim() ?? "";
  const apiKey = config.apiKey?.trim() ?? "";
  if (!accountId || !apiKey) {
    throw new Error("Cloudflare account ID and API key are required.");
  }

  const baseUrl = cloudflareBaseUrl(accountId);

  return {
    id: "cloudflare",
    model,
    streamChat: (input) =>
      streamOpenAiCompatible({
        baseUrl,
        apiKey,
        model: input.model ?? model,
        messages: input.messages,
      }),
  };
}

/**
 * AES-256-GCM envelope encryption for chat content and provider credentials.
 *
 * A Web Crypto port of lib/chat-crypto.ts. It is a rewrite rather than a copy
 * because Supabase's edge runtime is a Deno fork whose node compatibility lags
 * the upstream, `Buffer` does not exist, and behaviour differs between
 * `supabase functions serve` and hosted.
 *
 * The wire format is byte-identical to the Node implementation, so data written
 * by either side reads back on the other:
 *
 *     enc:v1:<base64 iv>:<base64 ciphertext||tag>
 *
 * That falls out for free — `crypto.subtle.encrypt` returns the 16-byte GCM tag
 * already appended to the ciphertext, which is exactly what
 * `Buffer.concat([encrypted, cipher.getAuthTag()])` produced.
 *
 * One behavioural difference worth knowing: `atob` is strict where
 * `Buffer.from(s, "base64")` silently tolerated malformed input, so a corrupt
 * stored value now throws at decode instead of failing the auth tag check.
 */
const PREFIX = "enc:v1:";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const TAG_LENGTH_BITS = 128;
const TAG_LENGTH_BYTES = TAG_LENGTH_BITS / 8;

let cachedKey: Promise<CryptoKey> | null = null;

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = (async () => {
      const raw = Deno.env.get("CHAT_CONTENT_ENCRYPTION_KEY");
      if (!raw) {
        throw new Error("CHAT_CONTENT_ENCRYPTION_KEY is not set");
      }

      const keyBytes = decodeBase64(raw);
      if (keyBytes.length !== KEY_LENGTH) {
        throw new Error(
          `CHAT_CONTENT_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes`,
        );
      }

      return await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
        "encrypt",
        "decrypt",
      ]);
    })();

    // Don't let one bad startup poison the cache for the life of the isolate.
    cachedKey.catch(() => {
      cachedKey = null;
    });
  }

  return cachedKey;
}

export async function encryptChatText(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const payload = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: TAG_LENGTH_BITS },
    key,
    new TextEncoder().encode(plaintext),
  );

  return `${PREFIX}${encodeBase64(iv)}:${encodeBase64(new Uint8Array(payload))}`;
}

/**
 * Values without the prefix are returned unchanged, matching the Node
 * implementation's legacy-plaintext passthrough.
 *
 * That passthrough is why the enc:v1: CHECK constraints exist: without them a
 * client could write plaintext into an encrypted column and have it read back
 * as though it had been decrypted.
 */
export async function decryptChatText(stored: string): Promise<string> {
  if (!stored.startsWith(PREFIX)) {
    return stored;
  }

  const rest = stored.slice(PREFIX.length);
  const sep = rest.indexOf(":");
  if (sep <= 0) {
    throw new Error("Invalid encrypted chat text format");
  }

  const iv = decodeBase64(rest.slice(0, sep));
  const payload = decodeBase64(rest.slice(sep + 1));
  if (iv.length !== IV_LENGTH || payload.length <= TAG_LENGTH_BYTES) {
    throw new Error("Invalid encrypted chat text payload");
  }

  const key = await getKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: TAG_LENGTH_BITS },
    key,
    payload,
  );

  return new TextDecoder().decode(plaintext);
}

/** Encrypts only when there is something to encrypt. */
export async function encryptOptional(
  value: string | null | undefined,
): Promise<string | null> {
  const trimmed = (value ?? "").trim();
  return trimmed ? await encryptChatText(trimmed) : null;
}

/** Decrypts only when there is something to decrypt. */
export async function decryptOptional(
  value: string | null | undefined,
): Promise<string | null> {
  return value ? await decryptChatText(value) : null;
}

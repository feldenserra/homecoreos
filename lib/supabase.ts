import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import type { Database } from "./database.types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set. Copy .env.example to .env.",
  );
}

/**
 * The one Supabase client for the whole app.
 *
 * Both values above are public by design — the anon key is in the app bundle,
 * and row-level security rather than key secrecy is what protects the data.
 *
 * On storage: AsyncStorage keeps the refresh token in plaintext on the device.
 * expo-secure-store looks like the obvious upgrade, but iOS fails above roughly
 * 2 KB per value and a Supabase OAuth session (access JWT + refresh token +
 * the full user object with identities) routinely exceeds that — a naive
 * SecureStore adapter fails silently and logs the user out on every cold start.
 * Use a chunking adapter, or store only the refresh token there, if you want it.
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Web completes OAuth and email confirmation by reading the redirect URL;
    // native completes it explicitly via exchangeCodeForSession, and leaving
    // this on would make supabase-js try to parse a URL that never arrives.
    detectSessionInUrl: Platform.OS === "web",
    flowType: "pkce",
  },
});

/**
 * autoRefreshToken is driven by a JS timer, and React Native suspends timers
 * for backgrounded apps. Without this the refresh tick is simply missed and the
 * user returns to a screen full of 401s.
 *
 * Web needs none of it: the browser keeps timers running and handles focus.
 */
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}

/** Base URL for the Edge Functions, used directly by the streaming chat call. */
export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export const SUPABASE_PUBLISHABLE_KEY = SUPABASE_ANON_KEY;

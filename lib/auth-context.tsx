import type { Session, User } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import { DUPLICATE_EMAIL_ERROR } from "./signup";
import { supabase } from "./supabase";

/**
 * Replaces auth.ts (NextAuth), middleware.ts, and the `await auth()` call that
 * every page and server action repeated.
 *
 * The identity that reaches the database is now the JWT's `sub`, read by
 * `auth.uid()` inside every RLS policy. Nothing client-side passes a user id,
 * which is what closed the old hole where server actions such as
 * `getHomeForMember(userId, homeId)` took the caller's id as an argument.
 */

WebBrowser.maybeCompleteAuthSession();

export type AuthResult = { error: string } | { ok: true } | { pending: true };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** True until the persisted session has been read from storage. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  signInWithGitHub: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Deep link Supabase sends the browser back to. It must be registered under
 * Auth > URL Configuration, and `scheme` must match app.json.
 *
 * In Expo Go this resolves to exp://192.168.x.x:8081/..., which cannot be
 * pre-registered stably per developer — use a development build for any work
 * that touches OAuth.
 */
function oauthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: "homecoreos",
    path: "auth/callback",
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Read the persisted session first so a returning user is not bounced to
    // the login screen for a frame.
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      // Deliberately generic, matching the old action: a precise message here
      // is a user-enumeration oracle.
      return error ? { error: "Invalid email or password." } : { ok: true };
    },
    [],
  );

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
    ): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          // Read by the handle_new_auth_user trigger to populate the profile.
          data: { name: name.trim() },
          emailRedirectTo: oauthRedirectUri(),
        },
      });

      if (error) {
        return {
          error: /already|registered|exists/i.test(error.message)
            ? DUPLICATE_EMAIL_ERROR
            : error.message,
        };
      }

      // With email confirmations on, signUp succeeds but returns no session.
      // The caller shows a "check your email" state rather than navigating.
      return data.session ? { ok: true } : { pending: true };
    },
    [],
  );

  const signInWithGitHub = useCallback(async (): Promise<AuthResult> => {
    const redirectTo = oauthRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo,
        // Native has no page to redirect; we drive the browser ourselves.
        skipBrowserRedirect: Platform.OS !== "web",
      },
    });

    if (error || !data?.url) {
      return { error: error?.message ?? "Could not start GitHub sign-in." };
    }

    if (Platform.OS === "web") {
      // detectSessionInUrl finishes the job after the redirect.
      return { ok: true };
    }

    // openAuthSessionAsync, not openBrowserAsync: only the former uses
    // ASWebAuthenticationSession / Chrome Custom Tabs and can hand the redirect
    // back to us.
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== "success") {
      return { error: "GitHub sign-in was cancelled." };
    }

    const code = new URL(result.url).searchParams.get("code");
    if (!code) {
      return { error: "GitHub sign-in did not return a code." };
    }

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    return exchangeError
      ? { error: exchangeError.message }
      : { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signInWithGitHub,
      signOut,
    }),
    [session, loading, signIn, signUp, signInWithGitHub, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}

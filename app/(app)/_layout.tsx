import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";
import { navScreenOptions } from "../../theme/paper-theme";

/**
 * The authenticated area.
 *
 * Replaces middleware.ts and the `const session = await auth(); if (!session)
 * redirect("/login")` block that every page and layout in the web app repeated.
 * One guard, one place.
 *
 * `<Redirect>` as a rendered component, not `router.replace()` in an effect:
 * navigating during the first render throws "Attempted to navigate before
 * mounting the Root Layout". Returning `null` while loading is also wrong — it
 * unmounts the children and loses their state on every session refresh — which
 * is why the loading branch renders a real screen.
 *
 * Note that this guard is convenience, not security. The boundary is RLS: an
 * unauthenticated client has no JWT, so `auth.uid()` is null and every policy
 * fails closed.
 */
export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ ...navScreenOptions, headerShown: false }} />;
}

import { Redirect, Stack } from "expo-router";
import { LoadingScreen } from "../../components/ui";
import { loginsAllowed } from "../../lib/allow-logins";
import { useAuth } from "../../lib/auth-context";
import { navScreenOptions } from "../../theme/paper-theme";

/**
 * Sign-in and sign-up.
 *
 * The reverse guard of (app)/_layout: an already-signed-in user has no business
 * here. The web app did this with `if (session) redirect("/app")` repeated in
 * both page components.
 */
export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (session) {
    return <Redirect href="/homes" />;
  }

  // Marketing-only mode: the landing page is the only route left.
  if (!loginsAllowed()) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ ...navScreenOptions, headerShown: false }} />
  );
}

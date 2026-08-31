import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { LandingPage } from "../components/landing/landing-page";
import { LoadingScreen } from "../components/ui";
import { loginsAllowed } from "../lib/allow-logins";
import { useAuth } from "../lib/auth-context";

/**
 * Entry point. Replaces app/page.tsx.
 *
 * This route owns "/". The home picker deliberately lives at /homes rather than
 * at (app)/index.tsx — route groups add no path segment, so both would resolve
 * to "/" and Expo Router would report conflicting screens.
 */
export default function Index() {
  const { session, loading } = useAuth();
  const allowLogins = loginsAllowed();

  if (loading) {
    return <LoadingScreen />;
  }

  if (session) {
    return <Redirect href="/homes" />;
  }

  // Native has no marketing surface: whoever installed the app already decided.
  // Unless logins are switched off, in which case the landing page is all there
  // is to show.
  if (Platform.OS !== "web" && allowLogins) {
    return <Redirect href="/login" />;
  }

  return <LandingPage allowLogins={allowLogins} />;
}

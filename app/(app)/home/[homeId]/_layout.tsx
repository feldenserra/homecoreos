import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { LoadingScreen } from "../../../../components/ui";
import { useAsync } from "../../../../hooks/use-async";
import { getHomeMembership } from "../../../../lib/api/homes";
import { HomeProvider } from "../../../../lib/home-context";
import { navScreenOptions } from "../../../../theme/paper-theme";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Membership gate for one household. Replaces app/app/[homeId]/layout.tsx.
 *
 * The web version validated the segment with `isValidHomeId` because the segment
 * *was* the join code. It is a uuid now, so the shape check is a uuid check —
 * and a well-formed uuid the caller is not a member of still resolves to null,
 * because `home_select` requires membership.
 *
 * A Stack rather than a Slot, because per-app settings sit alongside the tabs
 * and need to be pushed over them. The tab group draws its own header, so this
 * one hides it for that screen.
 */
export default function HomeLayout() {
  const params = useLocalSearchParams<{ homeId: string | string[] }>();

  // Typed as string, but a dynamic segment is string | string[] at runtime.
  const homeId = Array.isArray(params.homeId) ? params.homeId[0] : params.homeId;

  const state = useAsync(
    async () =>
      homeId && UUID_RE.test(homeId) ? await getHomeMembership(homeId) : null,
    [homeId],
  );

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  // Not a member, no such home, or a malformed id — all indistinguishable to
  // the client by design, and all resolved the same way the web app did.
  if (!state.data) {
    return <Redirect href="/homes" />;
  }

  return (
    <HomeProvider home={state.data}>
      <Stack screenOptions={navScreenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings/chat"
          options={{
            title: "Chat settings",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="settings/tasks"
          options={{
            title: "Tasks settings",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="settings/ai"
          options={{
            title: "AI settings",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="meal/recipe"
          options={{
            title: "Recipe",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="meal/ingredient"
          options={{
            title: "Ingredient",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="meal/actions"
          options={{
            title: "Recipe",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="meal/plan-add"
          options={{
            title: "Add meal",
            presentation: "modal",
          }}
        />
      </Stack>
    </HomeProvider>
  );
}

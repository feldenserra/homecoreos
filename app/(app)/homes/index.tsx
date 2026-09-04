import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Card,
  DisplayTitle,
  ErrorText,
  LoadingScreen,
  MetaLabel,
  Muted,
  Screen,
  Wordmark,
} from "../../../components/ui";
import { useAsync } from "../../../hooks/use-async";
import { getHomeQuota, listHomes } from "../../../lib/api/homes";
import { useAuth } from "../../../lib/auth-context";
import { formatHomeCode, MAX_CREATED_HOMES, MAX_JOINED_HOMES } from "../../../lib/home-code";
import { colors, gutter, radius, TOUCH_TARGET } from "../../../theme/tokens";

/**
 * "Which house?" — the home picker. Replaces app/app/page.tsx and home-gate.tsx.
 *
 * Lives at /homes rather than at (app)/index.tsx: route groups contribute no
 * path segment, so the latter would collide with app/index.tsx on "/".
 *
 * The create and join forms moved to their own routes. On the web they were
 * inline sections on a single scrolling page; on a phone two forms plus a list
 * on one screen is a keyboard-fighting exercise, and both are now reachable in
 * one tap.
 */
export default function HomesScreen() {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const state = useAsync(
    async () => {
      const [homes, quota] = await Promise.all([listHomes(), getHomeQuota()]);
      return { homes, quota };
    },
    [],
  );

  // Re-read on return from the create/join screens, which is what
  // router.refresh() did after a server action.
  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  const homes = state.data?.homes ?? [];
  const quota = state.data?.quota ?? { createdCount: 0, joinedCount: 0 };
  const canCreate = quota.createdCount < MAX_CREATED_HOMES;
  const remainingJoins = Math.max(0, MAX_JOINED_HOMES - quota.joinedCount);

  return (
    <Screen scroll style={[styles.screen, { paddingTop: insets.top + gutter.compact }]}>
      <View style={styles.header}>
        <Wordmark />
        <DisplayTitle size={32}>Which house?</DisplayTitle>
        <Muted>
          Create one home, or join others with a 12-character invite code.
        </Muted>
      </View>

      <ErrorText>{state.error}</ErrorText>

      {homes.length > 0 ? (
        <View style={styles.section}>
          <MetaLabel>Your homes</MetaLabel>
          {homes.map((home) => (
            <Pressable
              key={home.id}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.homeRow,
                pressed && styles.homeRowPressed,
              ]}
              onPress={() => router.push(`/home/${home.id}`)}
            >
              <View style={styles.homeRowText}>
                <Text style={styles.homeName}>{home.name}</Text>
                <Text style={styles.homeCode}>{formatHomeCode(home.code)}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.muted}
              />
            </Pressable>
          ))}
        </View>
      ) : null}

      {canCreate ? (
        <Card>
          <DisplayTitle size={22}>Create a home</DisplayTitle>
          <Muted>
            Start a shared space. You&apos;ll get a 12-character code to invite
            others. You can only create one home.
          </Muted>
          <Link href="/homes/new" asChild>
            <Button mode="contained" style={styles.button}>
              Create home
            </Button>
          </Link>
        </Card>
      ) : null}

      {remainingJoins > 0 ? (
        <Card>
          <DisplayTitle size={22}>Join a home</DisplayTitle>
          <Muted>
            Enter the 12-character code shared by someone who already has a
            home.{" "}
            {remainingJoins === MAX_JOINED_HOMES
              ? `You can join up to ${MAX_JOINED_HOMES} other homes.`
              : `You can join ${remainingJoins} more.`}
          </Muted>
          <Link href="/homes/join" asChild>
            <Button mode="contained-tonal" style={styles.button}>
              Join home
            </Button>
          </Link>
        </Card>
      ) : (
        <Muted>
          You&apos;ve joined the maximum of {MAX_JOINED_HOMES} other homes.
        </Muted>
      )}

      <Button
        mode="text"
        textColor={colors.muted}
        style={styles.signOut}
        onPress={async () => {
          await signOut();
          router.replace("/");
        }}
      >
        Sign out
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 24,
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
  },
  header: { gap: 6 },
  section: { gap: 8 },
  homeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: TOUCH_TARGET + 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  homeRowPressed: {
    backgroundColor: colors.paper2,
  },
  homeRowText: { gap: 2 },
  homeName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  homeCode: {
    color: colors.muted,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    letterSpacing: 1.4,
  },
  button: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
  },
  signOut: {
    alignSelf: "center",
  },
});

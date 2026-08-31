import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  DisplayTitle,
  ErrorText,
  LoadingScreen,
  MetaLabel,
  Muted,
  Screen,
} from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import { listTasks } from "../../../../../lib/api/tasks";
import { useAuth } from "../../../../../lib/auth-context";
import { useHome } from "../../../../../lib/home-context";
import type { TaskStatus } from "../../../../../lib/types";
import {
  colors,
  displayTextStyle,
  radius,
  shadowLift,
} from "../../../../../theme/tokens";
import { formatHomeCode } from "../../../../../lib/home-code";

/** The household dashboard. Replaces app/app/[homeId]/home/page.tsx. */
export default function DashboardScreen() {
  const home = useHome();
  const { user } = useAuth();

  const state = useAsync(async () => await listTasks(home.id), [home.id]);

  useFocusEffect(
    useCallback(() => {
      void state.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [home.id]),
  );

  const { openCount, stuckCount, completeCount } = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      not_started: 0,
      in_progress: 0,
      stuck: 0,
      complete: 0,
    };

    for (const task of state.data ?? []) {
      if (task.status in counts) {
        counts[task.status] += 1;
      }
    }

    return {
      openCount: counts.not_started + counts.in_progress + counts.stuck,
      stuckCount: counts.stuck,
      completeCount: counts.complete,
    };
  }, [state.data]);

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  // The profile name comes from the handle_new_auth_user trigger; email is the
  // fallback for a GitHub account that shared neither.
  const firstName =
    (user?.user_metadata?.name as string | undefined)?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const snapshot =
    openCount === 0
      ? "Nothing open"
      : stuckCount > 0
        ? `${openCount} open · ${stuckCount} stuck`
        : `${openCount} open`;

  const taskMeta =
    openCount === 0
      ? "Nothing open"
      : `${openCount} open · ${completeCount} done`;

  return (
    <Screen scroll style={styles.screen}>
      <View style={styles.header}>
        <DisplayTitle size={34}>Hey {firstName}</DisplayTitle>
        <Muted>{snapshot}</Muted>
      </View>

      <ErrorText>{state.error}</ErrorText>

      <View style={styles.grid}>
        <Tile
          icon="view-column"
          name="Tasks"
          meta={taskMeta}
          onPress={() => router.push(`/home/${home.id}/tasks`)}
        />
        <Tile
          icon="message"
          name="Chat"
          meta="Ask the house"
          onPress={() => router.push(`/home/${home.id}/chat`)}
        />
      </View>

      <View style={styles.inviteBlock}>
        <MetaLabel>Invite code</MetaLabel>
        <Text style={styles.code} selectable>
          {formatHomeCode(home.code)}
        </Text>
        <Muted>
          Anyone with this code can join the house. It is the only way in.
        </Muted>
      </View>
    </Screen>
  );
}

function Tile({
  icon,
  name,
  meta,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  name: string;
  meta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={colors.clay} />
      <Text style={styles.tileName}>{name}</Text>
      <Text style={styles.tileMeta}>{meta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 24,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  header: { gap: 8 },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  tile: {
    flex: 1,
    gap: 6,
    padding: 16,
    minHeight: 120,
    justifyContent: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadowLift,
  },
  tilePressed: {
    backgroundColor: colors.paper2,
  },
  tileName: {
    ...displayTextStyle,
    color: colors.ink,
    fontSize: 18,
    marginTop: 4,
  },
  tileMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  inviteBlock: { gap: 6 },
  code: {
    ...displayTextStyle,
    color: colors.ink,
    fontSize: 22,
    letterSpacing: 3,
    fontVariant: ["tabular-nums"],
  },
});

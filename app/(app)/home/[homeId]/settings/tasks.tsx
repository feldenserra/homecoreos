import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ErrorText, LoadingScreen, Muted, Screen } from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import { useHome } from "../../../../../lib/home-context";
import {
  getTasksViewMode,
  setTasksViewMode,
  TASKS_VIEW_MODES,
  type TasksViewMode,
} from "../../../../../lib/tasks-view";
import { colors } from "../../../../../theme/tokens";

const MODE_COPY: Record<TasksViewMode, { label: string; hint: string }> = {
  simple: {
    label: "Simple",
    hint: "A checklist. New items start in progress; checking one marks it complete.",
  },
  advanced: {
    label: "Advanced",
    hint: "The kanban board, with statuses and the option to assign a person.",
  },
};

/** Tasks app settings — which presentation to use for the same rows. */
export default function TasksSettingsScreen() {
  const home = useHome();
  const state = useAsync(async () => await getTasksViewMode(home.id), [home.id]);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const mode = state.data ?? "advanced";

  const choose = useCallback(
    async (next: TasksViewMode) => {
      if (next === mode) {
        return;
      }
      setActionError(null);
      setPending(true);
      try {
        await setTasksViewMode(home.id, next);
        state.setData(next);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Could not save that setting.",
        );
      } finally {
        setPending(false);
      }
    },
    [home.id, mode, state],
  );

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  return (
    <Screen scroll style={styles.screen}>
      <ErrorText>{state.error ?? actionError}</ErrorText>
      <Muted>How this house's tasks are shown on this device.</Muted>
      <View style={styles.row}>
        {TASKS_VIEW_MODES.map((candidate) => {
          const active = mode === candidate;
          return (
            <Pressable
              key={candidate}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: pending }}
              disabled={pending}
              onPress={() => void choose(candidate)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {MODE_COPY[candidate].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Muted>{MODE_COPY[mode].hint}</Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.claySoft,
    borderColor: colors.clay,
  },
  chipPressed: { opacity: 0.7 },
  chipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: { color: colors.ink },
});

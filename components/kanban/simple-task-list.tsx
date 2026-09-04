import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import {
  createTask as createTaskRequest,
  moveTask as moveTaskRequest,
  type Task,
} from "../../lib/api/tasks";
import {
  colors,
  INPUT_FONT_SIZE,
  radius,
  TOUCH_TARGET,
} from "../../theme/tokens";
import { ErrorText } from "../ui";

/**
 * Checklist presentation of the same `task` rows the kanban uses.
 *
 * New items are stored as in_progress. Checking one writes complete; unchecking
 * writes in_progress. Status is not shown, and there is no assignee control.
 */
export function SimpleTaskList({
  homeId,
  tasks,
  onTasksChange,
  onRefresh,
}: {
  homeId: string;
  tasks: Task[];
  onTasksChange: (next: Task[]) => void;
  onRefresh: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [pendingAdd, setPendingAdd] = useState(false);

  const ordered = useMemo(
    () =>
      // Hermes has no Array.toSorted.
      // eslint-disable-next-line unicorn/no-array-sort
      [...tasks].sort((a, b) => {
        const byCreated = a.createdAt.localeCompare(b.createdAt);
        return byCreated !== 0 ? byCreated : a.id.localeCompare(b.id);
      }),
    [tasks],
  );

  const toggle = useCallback(
    async (task: Task) => {
      const complete = task.status !== "complete";
      const status = complete ? "complete" : "in_progress";
      const previous = tasks;
      const targetMax = previous
        .filter((candidate) => candidate.status === status)
        .reduce((max, candidate) => Math.max(max, candidate.position), -1);
      const position = targetMax + 1;

      setError(null);
      setBusyTaskId(task.id);
      onTasksChange(
        previous.map((candidate) =>
          candidate.id === task.id
            ? { ...candidate, status, position }
            : candidate,
        ),
      );

      try {
        await moveTaskRequest({ homeId, taskId: task.id, status, position });
      } catch (err) {
        onTasksChange(previous);
        setError(
          err instanceof Error ? err.message : "Could not update that item.",
        );
      } finally {
        setBusyTaskId(null);
      }
    },
    [homeId, onTasksChange, tasks],
  );

  const add = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    setError(null);
    setPendingAdd(true);
    try {
      await createTaskRequest({
        homeId,
        title: trimmed,
        status: "in_progress",
      });
      setTitle("");
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    } finally {
      setPendingAdd(false);
    }
  }, [homeId, onRefresh, title]);

  return (
    <View style={styles.root}>
      <ErrorText>{error}</ErrorText>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {ordered.length === 0 ? (
          <Text style={styles.empty}>Nothing to do yet.</Text>
        ) : (
          ordered.map((task) => {
            const done = task.status === "complete";
            const busy = busyTaskId === task.id;
            return (
              <Pressable
                key={task.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done, disabled: busy }}
                disabled={busy}
                onPress={() => void toggle(task)}
                style={({ pressed }) => [
                  styles.row,
                  done && styles.rowDone,
                  pressed && styles.rowPressed,
                  busy && styles.rowBusy,
                ]}
              >
                <View
                  style={[styles.checkbox, done && styles.checkboxDone]}
                >
                  {done ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color={colors.muted}
                    />
                  ) : null}
                </View>
                <Text
                  style={[styles.title, done && styles.titleDone]}
                  numberOfLines={3}
                >
                  {task.title}
                </Text>
              </Pressable>
            );
          })
        )}

        <View style={styles.add}>
          <TextInput
            label="Add item"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            dense
            maxLength={200}
            onSubmitEditing={() => void add()}
            returnKeyType="done"
            style={styles.addInput}
          />
          <Button
            mode="contained"
            compact
            loading={pendingAdd}
            disabled={pendingAdd || !title.trim()}
            onPress={() => void add()}
          >
            Add
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
  },
  list: { flex: 1 },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowDone: {
    backgroundColor: colors.paper2,
    opacity: 0.65,
  },
  rowPressed: {
    backgroundColor: colors.paper2,
  },
  rowBusy: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkboxDone: {
    borderColor: colors.muted,
    backgroundColor: colors.paper2,
  },
  title: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  titleDone: {
    color: colors.muted,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  add: {
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  addInput: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
});

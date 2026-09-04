import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import {
  createTask as createTaskRequest,
  listCompletedTasks,
  moveTask as moveTaskRequest,
  TASK_PAGE_FIRST,
  TASK_PAGE_NEXT,
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
}: {
  homeId: string;
  tasks: Task[];
  onTasksChange: (next: Task[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [pendingAdd, setPendingAdd] = useState(false);

  const [completedOpen, setCompletedOpen] = useState(false);
  const [completed, setCompleted] = useState<Task[]>([]);
  const [completedFetched, setCompletedFetched] = useState(0);
  const [completedHasMore, setCompletedHasMore] = useState(true);
  const [completedLoaded, setCompletedLoaded] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);

  const loadCompleted = useCallback(
    async (offset: number, limit: number) => {
      setError(null);
      setCompletedLoading(true);
      try {
        const page = await listCompletedTasks(homeId, { offset, limit });
        setCompleted((current) => {
          if (offset === 0) {
            return page;
          }
          const seen = new Set(current.map((task) => task.id));
          return [...current, ...page.filter((task) => !seen.has(task.id))];
        });
        setCompletedFetched(offset + page.length);
        setCompletedHasMore(page.length === limit);
        setCompletedLoaded(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load completed tasks.",
        );
      } finally {
        setCompletedLoading(false);
      }
    },
    [homeId],
  );

  const toggleCompletedSection = useCallback(() => {
    const next = !completedOpen;
    setCompletedOpen(next);
    if (next && !completedLoaded && !completedLoading) {
      void loadCompleted(0, TASK_PAGE_FIRST);
    }
  }, [completedLoaded, completedLoading, completedOpen, loadCompleted]);

  const toggle = useCallback(
    async (task: Task) => {
      const markingComplete = task.status !== "complete";
      const status = markingComplete ? "complete" : "in_progress";
      const previousOpen = tasks;
      const previousCompleted = completed;
      const pool = markingComplete ? previousOpen : previousCompleted;
      const targetMax = pool
        .filter((candidate) => candidate.status === status)
        .reduce((max, candidate) => Math.max(max, candidate.position), -1);
      const position = targetMax + 1;
      const next: Task = {
        ...task,
        status,
        position,
        updatedAt: new Date().toISOString(),
      };

      setError(null);
      setBusyTaskId(task.id);
      if (markingComplete) {
        onTasksChange(previousOpen.filter((candidate) => candidate.id !== task.id));
        if (completedLoaded) {
          setCompleted([next, ...previousCompleted]);
        }
      } else {
        setCompleted(
          previousCompleted.filter((candidate) => candidate.id !== task.id),
        );
        onTasksChange([next, ...previousOpen]);
      }

      try {
        await moveTaskRequest({ homeId, taskId: task.id, status, position });
      } catch (err) {
        onTasksChange(previousOpen);
        setCompleted(previousCompleted);
        setError(
          err instanceof Error ? err.message : "Could not update that item.",
        );
      } finally {
        setBusyTaskId(null);
      }
    },
    [completed, completedLoaded, homeId, onTasksChange, tasks],
  );

  const cancelCompose = useCallback(() => {
    setComposing(false);
    setTitle("");
  }, []);

  const add = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    setError(null);
    setPendingAdd(true);
    try {
      const created = await createTaskRequest({
        homeId,
        title: trimmed,
        status: "in_progress",
      });
      onTasksChange([created, ...tasks]);
      cancelCompose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    } finally {
      setPendingAdd(false);
    }
  }, [cancelCompose, homeId, onTasksChange, tasks, title]);

  return (
    <View style={styles.root}>
      <ErrorText>{error}</ErrorText>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {composing ? (
          <View style={styles.composeCard}>
            <TextInput
              label="Task"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              dense
              autoFocus
              maxLength={200}
              onSubmitEditing={() => void add()}
              returnKeyType="done"
              style={styles.composeInput}
            />
            <View style={styles.composeActions}>
              <Button
                mode="text"
                compact
                textColor={colors.muted}
                disabled={pendingAdd}
                onPress={cancelCompose}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                compact
                loading={pendingAdd}
                disabled={pendingAdd || !title.trim()}
                onPress={() => void add()}
              >
                Save
              </Button>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add task"
            onPress={() => setComposing(true)}
            style={({ pressed }) => [
              styles.addTrigger,
              pressed && styles.addTriggerPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={colors.muted}
            />
            <Text style={styles.addTriggerLabel}>Add task</Text>
          </Pressable>
        )}

        {tasks.length === 0 && !composing ? (
          <Text style={styles.empty}>Nothing to do yet.</Text>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              done={false}
              busy={busyTaskId === task.id}
              onToggle={() => void toggle(task)}
            />
          ))
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: completedOpen }}
          onPress={toggleCompletedSection}
          style={({ pressed }) => [
            styles.completedToggle,
            pressed && styles.completedTogglePressed,
          ]}
        >
          <MaterialCommunityIcons
            name={completedOpen ? "chevron-down" : "chevron-right"}
            size={20}
            color={colors.muted}
          />
          <Text style={styles.completedToggleLabel}>Completed</Text>
        </Pressable>

        {completedOpen ? (
          <>
            {completed.length === 0 && completedLoaded && !completedLoading ? (
              <Text style={styles.empty}>Nothing completed.</Text>
            ) : (
              completed.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  done
                  busy={busyTaskId === task.id}
                  onToggle={() => void toggle(task)}
                />
              ))
            )}
            {completedHasMore && completedLoaded ? (
              <Button
                mode="text"
                textColor={colors.muted}
                loading={completedLoading}
                disabled={completedLoading}
                onPress={() =>
                  void loadCompleted(completedFetched, TASK_PAGE_NEXT)
                }
              >
                Load more
              </Button>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function TaskRow({
  task,
  done,
  busy,
  onToggle,
}: {
  task: Task;
  done: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done, disabled: busy }}
      disabled={busy}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        done && styles.rowDone,
        pressed && styles.rowPressed,
        busy && styles.rowBusy,
      ]}
    >
      <View style={[styles.checkbox, done && styles.checkboxDone]}>
        {done ? (
          <MaterialCommunityIcons name="check" size={16} color={colors.muted} />
        ) : null}
      </View>
      <Text style={[styles.title, done && styles.titleDone]} numberOfLines={3}>
        {task.title}
      </Text>
    </Pressable>
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
  addTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: 12,
    opacity: 0.55,
  },
  addTriggerPressed: {
    opacity: 0.35,
  },
  addTriggerLabel: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "600",
  },
  composeCard: {
    gap: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  composeInput: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  composeActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
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
  completedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: TOUCH_TARGET,
    marginTop: 8,
  },
  completedTogglePressed: {
    opacity: 0.7,
  },
  completedToggleLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});

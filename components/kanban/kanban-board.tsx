import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Button, Modal, Portal, TextInput } from "react-native-paper";
import {
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  moveTask as moveTaskRequest,
  type Task,
} from "../../lib/api/tasks";
import { TASK_STATUSES, type TaskStatus } from "../../lib/types";
import {
  colors,
  displayTextStyle,
  INPUT_FONT_SIZE,
  radius,
  shadowLift,
  statusColors,
  TOUCH_TARGET,
} from "../../theme/tokens";
import { ErrorText, MetaLabel } from "../ui";

/**
 * The shared task board. Replaces components/kanban/kanban-board.tsx.
 *
 * What carried over:
 *  - Four columns in TASK_STATUSES order, tasks ordered by `position`.
 *  - A horizontal pager, one column per screen. The web version did this with
 *    CSS scroll-snap below 48em; here it is a paging ScrollView, which is the
 *    same interaction with native momentum.
 *  - The 2x2 status picker, opened by tapping a card. The web version was an
 *    absolutely-positioned popover clamped to the viewport with
 *    getBoundingClientRect; on a phone a centred sheet is the same gesture
 *    without the arithmetic, so the clamping code is gone rather than ported.
 *  - Optimistic reorder, now with an explicit rollback. `startTransition` +
 *    `router.refresh()` used to resync from the server on failure; there is no
 *    server render to fall back on, so the previous state is captured and
 *    restored.
 */

const COLUMN_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  stuck: "Stuck",
  complete: "Complete",
};

/** Row-major 2x2: not started, in progress / complete, stuck. */
const PICKER_CELLS: TaskStatus[] = [
  "not_started",
  "in_progress",
  "complete",
  "stuck",
];

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = {
    not_started: [],
    in_progress: [],
    stuck: [],
    complete: [],
  };

  for (const task of tasks) {
    if (task.status in groups) {
      groups[task.status].push(task);
    }
  }
  for (const status of TASK_STATUSES) {
    groups[status].sort((a, b) => a.position - b.position);
  }
  return groups;
}

export function KanbanBoard({
  homeId,
  tasks,
  onTasksChange,
  onRefresh,
}: {
  homeId: string;
  tasks: Task[];
  /** Applies an optimistic update; returning the previous list enables rollback. */
  onTasksChange: (next: Task[]) => void;
  onRefresh: () => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const groups = useMemo(() => groupByStatus(tasks), [tasks]);

  const [picked, setPicked] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Column width: full-bleed pager on phones, three-ish columns on a wide web
  // viewport where there is room for them.
  const columnWidth = width >= 900 ? 320 : width - 32;

  const move = useCallback(
    async (task: Task, status: TaskStatus) => {
      setPicked(null);
      if (task.status === status) {
        return;
      }

      // Captured for rollback: the optimistic update below is applied before the
      // request, and there is no server render to fall back to on failure.
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
        setError(err instanceof Error ? err.message : "Could not move task.");
      } finally {
        setBusyTaskId(null);
      }
    },
    [homeId, onTasksChange, tasks],
  );

  const remove = useCallback(
    async (task: Task) => {
      setConfirmDelete(null);
      const previous = tasks;

      setError(null);
      setBusyTaskId(task.id);
      onTasksChange(previous.filter((candidate) => candidate.id !== task.id));

      try {
        await deleteTaskRequest({ homeId, taskId: task.id });
      } catch (err) {
        onTasksChange(previous);
        setError(err instanceof Error ? err.message : "Could not delete task.");
      } finally {
        setBusyTaskId(null);
      }
    },
    [homeId, onTasksChange, tasks],
  );

  const add = useCallback(
    async (status: TaskStatus, title: string) => {
      setError(null);
      try {
        // create_task computes max(position) + 1 server-side, so there is
        // nothing to guess and nothing to reconcile.
        await createTaskRequest({ homeId, title, status });
        await onRefresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add task.");
      }
    },
    [homeId, onRefresh],
  );

  return (
    <View style={styles.root}>
      <ErrorText>{error}</ErrorText>

      <ScrollView
        horizontal
        pagingEnabled={columnWidth >= width - 32}
        snapToInterval={columnWidth + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.columns}
      >
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            width={columnWidth}
            tasks={groups[status]}
            busyTaskId={busyTaskId}
            onOpenTask={setPicked}
            onAdd={add}
          />
        ))}
      </ScrollView>

      <Portal>
        <Modal
          visible={picked !== null}
          onDismiss={() => setPicked(null)}
          contentContainerStyle={styles.sheet}
        >
          {picked ? (
            <>
              <Text style={styles.sheetTitle} numberOfLines={3}>
                {picked.title}
              </Text>
              <MetaLabel>Move to</MetaLabel>

              <View style={styles.pickerGrid}>
                {PICKER_CELLS.map((status) => (
                  <Pressable
                    key={status}
                    accessibilityRole="button"
                    onPress={() => void move(picked, status)}
                    style={({ pressed }) => [
                      styles.pickerCell,
                      { borderColor: statusColors[status] },
                      picked.status === status && styles.pickerCellCurrent,
                      pressed && styles.pickerCellPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.accentDot,
                        { backgroundColor: statusColors[status] },
                      ]}
                    />
                    <Text style={styles.pickerLabel}>
                      {COLUMN_LABELS[status]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Button
                mode="text"
                textColor="#b3261e"
                icon={() => (
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color="#b3261e"
                  />
                )}
                onPress={() => {
                  const target = picked;
                  setPicked(null);
                  setConfirmDelete(target);
                }}
              >
                Delete task
              </Button>
            </>
          ) : null}
        </Modal>

        <Modal
          visible={confirmDelete !== null}
          onDismiss={() => setConfirmDelete(null)}
          contentContainerStyle={styles.sheet}
        >
          {confirmDelete ? (
            <>
              <Text style={styles.sheetTitle}>Delete this task?</Text>
              <Text style={styles.sheetBody} numberOfLines={3}>
                {confirmDelete.title}
              </Text>
              <View style={styles.confirmRow}>
                <Button
                  mode="text"
                  textColor={colors.muted}
                  onPress={() => setConfirmDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  buttonColor="#b3261e"
                  onPress={() => void remove(confirmDelete)}
                >
                  Delete
                </Button>
              </View>
            </>
          ) : null}
        </Modal>
      </Portal>
    </View>
  );
}

function Column({
  status,
  width,
  tasks,
  busyTaskId,
  onOpenTask,
  onAdd,
}: {
  status: TaskStatus;
  width: number;
  tasks: Task[];
  busyTaskId: string | null;
  onOpenTask: (task: Task) => void;
  onAdd: (status: TaskStatus, title: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    setPending(true);
    await onAdd(status, trimmed);
    setPending(false);
    setTitle("");
    setAdding(false);
  };

  return (
    <View style={[styles.column, { width }]}>
      <View style={styles.columnHeader}>
        <View
          style={[styles.accentBar, { backgroundColor: statusColors[status] }]}
        />
        <Text style={styles.columnLabel}>{COLUMN_LABELS[status]}</Text>
        <Text style={styles.columnCount}>{tasks.length}</Text>
      </View>

      <ScrollView
        style={styles.columnBody}
        contentContainerStyle={styles.columnBodyContent}
        showsVerticalScrollIndicator={false}
      >
        {tasks.map((task) => (
          <Pressable
            key={task.id}
            accessibilityRole="button"
            accessibilityHint="Opens the move and delete options"
            onPress={() => onOpenTask(task)}
            disabled={busyTaskId === task.id}
            style={({ pressed }) => [
              styles.taskCard,
              pressed && styles.taskCardPressed,
              busyTaskId === task.id && styles.taskCardBusy,
            ]}
          >
            <Text style={styles.taskTitle}>{task.title}</Text>
            {busyTaskId === task.id ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : null}
          </Pressable>
        ))}

        {tasks.length === 0 && !adding ? (
          <Text style={styles.emptyText}>Nothing here.</Text>
        ) : null}

        {adding ? (
          <View style={styles.addForm}>
            <TextInput
              label="Task"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              dense
              autoFocus
              maxLength={200}
              onSubmitEditing={submit}
              returnKeyType="done"
              style={styles.addInput}
            />
            <View style={styles.addActions}>
              <Button
                mode="text"
                compact
                textColor={colors.muted}
                onPress={() => {
                  setAdding(false);
                  setTitle("");
                }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                compact
                loading={pending}
                disabled={pending || !title.trim()}
                onPress={submit}
              >
                Add
              </Button>
            </View>
          </View>
        ) : (
          <Button
            mode="text"
            compact
            textColor={colors.muted}
            style={styles.addTrigger}
            icon={() => (
              <MaterialCommunityIcons
                name="plus"
                size={18}
                color={colors.muted}
              />
            )}
            onPress={() => setAdding(true)}
          >
            Add task
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 8 },
  columns: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accentBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  columnLabel: {
    ...displayTextStyle,
    color: colors.ink,
    fontSize: 16,
    flex: 1,
  },
  columnCount: {
    color: colors.muted,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  columnBody: { flex: 1 },
  columnBodyContent: {
    gap: 8,
    paddingBottom: 24,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: TOUCH_TARGET,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  taskCardPressed: {
    backgroundColor: colors.paper2,
  },
  taskCardBusy: {
    opacity: 0.6,
  },
  taskTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: 4,
  },
  addTrigger: {
    alignSelf: "flex-start",
  },
  addForm: {
    gap: 8,
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
  addActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
  },
  sheet: {
    alignSelf: "center",
    width: "88%",
    maxWidth: 360,
    gap: 12,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadowLift,
  },
  sheetTitle: {
    ...displayTextStyle,
    color: colors.ink,
    fontSize: 18,
  },
  sheetBody: {
    color: colors.muted,
    fontSize: 14,
  },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerCell: {
    // Two per row, accounting for the 8px gap.
    width: "47%",
    flexGrow: 1,
    minHeight: 64,
    gap: 6,
    padding: 10,
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.paper,
  },
  pickerCellCurrent: {
    backgroundColor: colors.claySoft,
  },
  pickerCellPressed: {
    opacity: 0.7,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickerLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },
});

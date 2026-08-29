"use client";

import { Box, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createTask, moveTask } from "../../app/app/actions";
import { TASK_STATUSES, type TaskStatus } from "../../lib/types";

export type KanbanTask = {
  id: string;
  homeId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
};

const COLUMN_META: Record<TaskStatus, { label: string; accent: string }> = {
  not_started: {
    label: "Not started",
    accent: "var(--hc-col-not-started)",
  },
  in_progress: {
    label: "In progress",
    accent: "var(--hc-col-in-progress)",
  },
  stuck: {
    label: "Stuck",
    accent: "var(--hc-col-stuck)",
  },
  complete: {
    label: "Complete",
    accent: "var(--hc-col-complete)",
  },
};

/** Row-major 2x2: TL, TR, BL, BR — clockwise from top-left is NS, IP, stuck, complete. */
const PICKER_CELLS: TaskStatus[] = [
  "not_started",
  "in_progress",
  "complete",
  "stuck",
];

const PICKER_SIZE = 172;
const PICKER_PAD = 12;

function sortTasks(list: KanbanTask[]) {
  return [...list].sort((a, b) => a.position - b.position);
}

function groupByStatus(tasks: KanbanTask[]) {
  const map: Record<TaskStatus, KanbanTask[]> = {
    not_started: [],
    in_progress: [],
    stuck: [],
    complete: [],
  };
  for (const task of tasks) {
    map[task.status].push(task);
  }
  for (const status of TASK_STATUSES) {
    map[status] = sortTasks(map[status]);
  }
  return map;
}

function clampPickerPos(rect: DOMRect) {
  const left = Math.max(
    PICKER_PAD,
    Math.min(
      rect.left + rect.width / 2 - PICKER_SIZE / 2,
      window.innerWidth - PICKER_SIZE - PICKER_PAD,
    ),
  );
  const top = Math.max(
    PICKER_PAD,
    Math.min(
      rect.top + rect.height / 2 - PICKER_SIZE / 2,
      window.innerHeight - PICKER_SIZE - PICKER_PAD,
    ),
  );
  return { left, top };
}

function TaskCard({
  task,
  selected,
  onOpen,
}: {
  task: KanbanTask;
  selected?: boolean;
  onOpen: (task: KanbanTask, anchor: DOMRect) => void;
}) {
  return (
    <button
      type="button"
      className={`task-card${selected ? " task-card--selected" : ""}`}
      aria-haspopup="dialog"
      aria-expanded={selected}
      onClick={(event) => {
        onOpen(task, event.currentTarget.getBoundingClientRect());
      }}
    >
      <Text component="span" fw={550} size="sm" lh={1.35}>
        {task.title}
      </Text>
    </button>
  );
}

function Column({
  status,
  tasks,
  movingTaskId,
  onOpenPicker,
}: {
  status: TaskStatus;
  tasks: KanbanTask[];
  movingTaskId: string | null;
  onOpenPicker: (task: KanbanTask, anchor: DOMRect) => void;
}) {
  const meta = COLUMN_META[status];

  return (
    <Box
      className="kanban-column"
      style={{ ["--col-accent" as string]: meta.accent }}
    >
      <Group justify="space-between" mb="sm" wrap="nowrap">
        <Text fw={600} size="sm">
          {meta.label}
        </Text>
        <span className={`status-badge status-badge--${status}`}>
          {tasks.length}
        </span>
      </Group>
      <Stack gap={8} mih={48}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            selected={movingTaskId === task.id}
            onOpen={onOpenPicker}
          />
        ))}
      </Stack>
    </Box>
  );
}

export function KanbanBoard({
  homeId,
  initialTasks,
}: {
  homeId: string;
  initialTasks: KanbanTask[];
}) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [tasks, setTasks] = useState(initialTasks);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [activeCol, setActiveCol] = useState(0);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const columns = useMemo(() => groupByStatus(tasks), [tasks]);
  const movingTask = tasks.find((t) => t.id === movingTaskId) ?? null;

  useEffect(() => {
    if (!movingTaskId) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMovingTaskId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [movingTaskId]);

  useEffect(() => {
    if (!movingTaskId) {
      return;
    }
    const current = pickerRef.current?.querySelector<HTMLButtonElement>(
      ".task-move-cell--current",
    );
    current?.focus();
  }, [movingTaskId]);

  function onBoardScroll() {
    const el = boardRef.current;
    if (!el) {
      return;
    }
    const first = el.children[0] as HTMLElement | undefined;
    if (!first) {
      return;
    }
    const colWidth = first.offsetWidth + 12;
    setActiveCol(
      Math.min(
        TASK_STATUSES.length - 1,
        Math.max(0, Math.round(el.scrollLeft / colWidth)),
      ),
    );
  }

  function scrollToColumn(index: number) {
    const el = boardRef.current;
    if (!el) {
      return;
    }
    const col = el.children[index] as HTMLElement | undefined;
    col?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }

  function closePicker() {
    setMovingTaskId(null);
  }

  function onOpenPicker(task: KanbanTask, anchor: DOMRect) {
    if (movingTaskId === task.id) {
      closePicker();
      return;
    }
    setPickerPos(clampPickerPos(anchor));
    setMovingTaskId(task.id);
  }

  function persistMove(task: KanbanTask, nextStatus: TaskStatus) {
    if (task.status === nextStatus) {
      closePicker();
      return;
    }

    const position = tasks.filter((t) => t.status === nextStatus).length;
    const sourceStatus = task.status;

    setTasks((prev) => {
      const without = prev.filter((t) => t.id !== task.id);
      const dest = sortTasks(
        without.filter((t) => t.status === nextStatus),
      );
      const moved: KanbanTask = {
        ...task,
        status: nextStatus,
        position,
      };
      const reindexedDest = [...dest, moved].map((t, i) => ({
        ...t,
        position: i,
      }));
      const source = sortTasks(
        without.filter((t) => t.status === sourceStatus),
      ).map((t, i) => ({ ...t, position: i }));
      const other = without.filter(
        (t) => t.status !== nextStatus && t.status !== sourceStatus,
      );
      return [...other, ...source, ...reindexedDest];
    });

    closePicker();
    startTransition(async () => {
      await moveTask({
        homeId,
        taskId: task.id,
        status: nextStatus,
        position,
      });
      router.refresh();
    });
    scrollToColumn(TASK_STATUSES.indexOf(nextStatus));
  }

  return (
    <Box className="kanban-page">
      <div className="kanban-pager" role="tablist" aria-label="Task columns">
        {TASK_STATUSES.map((status, index) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={activeCol === index}
            className={`kanban-pager-chip${activeCol === index ? " kanban-pager-chip--active" : ""}`}
            style={{ ["--col-accent" as string]: COLUMN_META[status].accent }}
            onClick={() => scrollToColumn(index)}
          >
            <span className="kanban-pager-dot" />
            {COLUMN_META[status].label}
          </button>
        ))}
      </div>

      <div ref={boardRef} className="kanban-board" onScroll={onBoardScroll}>
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={columns[status]}
            movingTaskId={movingTaskId}
            onOpenPicker={onOpenPicker}
          />
        ))}
      </div>

      {movingTask ? (
        <>
          <button
            type="button"
            className="task-move-catcher"
            aria-label="Dismiss move picker"
            onClick={closePicker}
          />
          <div
            ref={pickerRef}
            className="task-move-popover"
            role="dialog"
            aria-label={`Move “${movingTask.title}”`}
            style={{ top: pickerPos.top, left: pickerPos.left }}
          >
            <div className="task-move-grid">
              {PICKER_CELLS.map((status) => {
                const current = status === movingTask.status;
                return (
                  <button
                    key={status}
                    type="button"
                    className={`task-move-cell task-move-cell--${status}${current ? " task-move-cell--current" : ""}`}
                    aria-pressed={current}
                    aria-label={COLUMN_META[status].label}
                    onClick={() => persistMove(movingTask, status)}
                  >
                    {COLUMN_META[status].label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {addOpen ? (
        <Box className="add-task-sheet" component="section">
          <form
            action={(formData) => {
              setAddError(null);
              startTransition(async () => {
                const result = await createTask(homeId, formData);
                if (result && "error" in result) {
                  setAddError(result.error);
                  return;
                }
                setAddOpen(false);
                router.refresh();
              });
            }}
          >
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Text fw={600} size="sm">
                  New task
                </Text>
                <Button
                  type="button"
                  variant="subtle"
                  color="gray"
                  size="compact-sm"
                  onClick={() => setAddOpen(false)}
                >
                  Cancel
                </Button>
              </Group>
              <TextInput
                name="title"
                placeholder="What needs doing?"
                required
                autoFocus
                maxLength={200}
              />
              {addError ? (
                <Text size="sm" c="red">
                  {addError}
                </Text>
              ) : null}
              <Button type="submit" loading={pending}>
                Add to Not started
              </Button>
            </Stack>
          </form>
        </Box>
      ) : (
        <button
          type="button"
          className="add-task-fab"
          aria-label="Add task"
          onClick={() => {
            setAddError(null);
            setAddOpen(true);
          }}
        >
          <IconPlus size={24} stroke={2} />
        </button>
      )}
    </Box>
  );
}

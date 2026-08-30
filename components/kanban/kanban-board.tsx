"use client";

import { Box, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createTask, deleteTask, moveTask } from "../../app/app/actions";
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
const ADD_POPOVER_WIDTH = 260;
const ADD_POPOVER_HEIGHT = 180;
const DELETE_CONFIRM_HEIGHT = 148;
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

function clampPickerPos(rect: DOMRect, width: number, height = width) {
  const left = Math.max(
    PICKER_PAD,
    Math.min(
      rect.left + rect.width / 2 - width / 2,
      window.innerWidth - width - PICKER_PAD,
    ),
  );
  const top = Math.max(
    PICKER_PAD,
    Math.min(
      rect.top + rect.height / 2 - height / 2,
      window.innerHeight - height - PICKER_PAD,
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
  addingStatus,
  onOpenPicker,
  onOpenAdd,
}: {
  status: TaskStatus;
  tasks: KanbanTask[];
  movingTaskId: string | null;
  addingStatus: TaskStatus | null;
  onOpenPicker: (task: KanbanTask, anchor: DOMRect) => void;
  onOpenAdd: (status: TaskStatus, anchor: DOMRect) => void;
}) {
  const meta = COLUMN_META[status];
  const addSelected = addingStatus === status;

  return (
    <Box
      className={`kanban-column${addSelected ? " kanban-column--adding" : ""}`}
      style={{ ["--col-accent" as string]: meta.accent }}
    >
      <Group
        className="kanban-column-header"
        justify="space-between"
        mb="sm"
        wrap="nowrap"
      >
        <Text fw={600} size="sm">
          {meta.label}
        </Text>
        <span className={`status-badge status-badge--${status}`}>
          {tasks.length}
        </span>
      </Group>
      <div className="task-column-body">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            selected={movingTaskId === task.id}
            onOpen={onOpenPicker}
          />
        ))}
      </div>
      <button
        type="button"
        className="kanban-column__plus"
        aria-label={`Add task to ${meta.label}`}
        aria-haspopup="dialog"
        aria-expanded={addSelected}
        onClick={(event) => {
          onOpenAdd(status, event.currentTarget.getBoundingClientRect());
        }}
      >
        <IconPlus size={16} stroke={2} />
      </button>
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
  const addPickerRef = useRef<HTMLDivElement | null>(null);
  const [tasks, setTasks] = useState(initialTasks);
  const [addError, setAddError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [activeCol, setActiveCol] = useState(0);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [addingStatus, setAddingStatus] = useState<TaskStatus | null>(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [addPickerPos, setAddPickerPos] = useState({ top: 0, left: 0 });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const pickerAnchorRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const columns = useMemo(() => groupByStatus(tasks), [tasks]);
  const movingTask = tasks.find((t) => t.id === movingTaskId) ?? null;
  const overlayOpen = Boolean(movingTask || addingStatus);

  useEffect(() => {
    if (!overlayOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMovingTaskId(null);
        setConfirmingDelete(false);
        setAddingStatus(null);
        setAddError(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlayOpen]);

  useEffect(() => {
    if (!movingTaskId || confirmingDelete) {
      return;
    }
    const current = pickerRef.current?.querySelector<HTMLButtonElement>(
      ".task-move-cell--current",
    );
    current?.focus();
  }, [movingTaskId, confirmingDelete]);

  useEffect(() => {
    if (!confirmingDelete) {
      return;
    }
    pickerRef.current
      ?.querySelector<HTMLButtonElement>(".task-move-confirm-cancel")
      ?.focus();
  }, [confirmingDelete]);

  useEffect(() => {
    if (!addingStatus) {
      return;
    }
    const input = addPickerRef.current?.querySelector<HTMLInputElement>(
      "input[name='title']",
    );
    input?.focus();
  }, [addingStatus]);

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
    setConfirmingDelete(false);
  }

  function closeAddPicker() {
    setAddingStatus(null);
    setAddError(null);
  }

  function closeOverlay() {
    closePicker();
    closeAddPicker();
  }

  function onOpenPicker(task: KanbanTask, anchor: DOMRect) {
    if (movingTaskId === task.id) {
      closePicker();
      return;
    }
    closeAddPicker();
    pickerAnchorRef.current = anchor;
    setConfirmingDelete(false);
    setPickerPos(clampPickerPos(anchor, PICKER_SIZE));
    setMovingTaskId(task.id);
  }

  function onOpenAdd(status: TaskStatus, anchor: DOMRect) {
    if (addingStatus === status) {
      closeAddPicker();
      return;
    }
    closePicker();
    setAddError(null);
    setAddPickerPos(
      clampPickerPos(anchor, ADD_POPOVER_WIDTH, ADD_POPOVER_HEIGHT),
    );
    setAddingStatus(status);
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

  function startDeleteConfirm() {
    const anchor = pickerAnchorRef.current;
    if (anchor) {
      setPickerPos(
        clampPickerPos(anchor, ADD_POPOVER_WIDTH, DELETE_CONFIRM_HEIGHT),
      );
    }
    setConfirmingDelete(true);
  }

  function cancelDeleteConfirm() {
    const anchor = pickerAnchorRef.current;
    if (anchor) {
      setPickerPos(clampPickerPos(anchor, PICKER_SIZE));
    }
    setConfirmingDelete(false);
  }

  function persistDelete(task: KanbanTask) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    closePicker();
    startTransition(async () => {
      await deleteTask({
        homeId,
        taskId: task.id,
      });
      router.refresh();
    });
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
            addingStatus={addingStatus}
            onOpenPicker={onOpenPicker}
            onOpenAdd={onOpenAdd}
          />
        ))}
      </div>

      {overlayOpen ? (
        <button
          type="button"
          className="task-move-catcher"
          aria-label="Dismiss"
          onClick={closeOverlay}
        />
      ) : null}

      {movingTask ? (
        <div
          ref={pickerRef}
          className={`task-move-popover${confirmingDelete ? " task-move-popover--confirm" : ""}`}
          role="dialog"
          aria-label={
            confirmingDelete
              ? `Delete “${movingTask.title}”?`
              : `Move “${movingTask.title}”`
          }
          style={{ top: pickerPos.top, left: pickerPos.left }}
        >
          {confirmingDelete ? (
            <div className="task-move-confirm">
              <Text fw={600} size="sm">
                Delete this task?
              </Text>
              <p className="task-move-confirm-task">{movingTask.title}</p>
              <div className="task-move-confirm-actions">
                <button
                  type="button"
                  className="task-move-confirm-cancel"
                  onClick={cancelDeleteConfirm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="task-move-confirm-delete"
                  onClick={() => persistDelete(movingTask)}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="task-move-grid-wrap">
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
              <button
                type="button"
                className="task-move-delete"
                aria-label={`Delete “${movingTask.title}”`}
                onClick={startDeleteConfirm}
              >
                <IconTrash size={16} stroke={1.7} />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {addingStatus ? (
        <div
          ref={addPickerRef}
          className="task-add-popover"
          role="dialog"
          aria-label={`Add task to ${COLUMN_META[addingStatus].label}`}
          style={{ top: addPickerPos.top, left: addPickerPos.left }}
        >
          <form
            action={(formData) => {
              setAddError(null);
              formData.set("status", addingStatus);
              startTransition(async () => {
                const result = await createTask(homeId, formData);
                if (result && "error" in result) {
                  setAddError(result.error);
                  return;
                }
                closeAddPicker();
                router.refresh();
              });
            }}
          >
            <Stack gap="sm">
              <Text fw={600} size="sm">
                New task
              </Text>
              <TextInput
                name="title"
                placeholder="What needs doing?"
                required
                maxLength={200}
              />
              {addError ? (
                <Text size="sm" c="red">
                  {addError}
                </Text>
              ) : null}
              <Button type="submit" size="compact-sm" loading={pending}>
                Add to {COLUMN_META[addingStatus].label}
              </Button>
            </Stack>
          </form>
        </div>
      ) : null}
    </Box>
  );
}

"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

const COLUMN_META: Record<
  TaskStatus,
  { label: string; accent: string }
> = {
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

function TaskCard({
  task,
  dragging,
}: {
  task: KanbanTask;
  dragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card${dragging ? " task-card--overlay" : ""}`}
    >
      <Text fw={550} size="sm" lh={1.35}>
        {task.title}
      </Text>
    </Box>
  );
}

function Column({
  status,
  tasks,
}: {
  status: TaskStatus;
  tasks: KanbanTask[];
}) {
  const meta = COLUMN_META[status];
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  return (
    <Box
      ref={setNodeRef}
      className={`kanban-column${isOver ? " kanban-column--over" : ""}`}
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
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack gap={8} mih={48}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </Stack>
      </SortableContext>
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
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dndReady, setDndReady] = useState(false);
  const [activeCol, setActiveCol] = useState(0);

  useEffect(() => {
    setDndReady(true);
  }, []);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const columns = useMemo(() => groupByStatus(tasks), [tasks]);
  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

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
    col?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function findContainer(id: string): TaskStatus | null {
    if (TASK_STATUSES.includes(id as TaskStatus)) {
      return id as TaskStatus;
    }
    const task = tasks.find((t) => t.id === id);
    return task?.status ?? null;
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeContainer = findContainer(String(active.id));
    const overId = String(over.id);
    const overContainer =
      findContainer(overId) ??
      (TASK_STATUSES.includes(overId as TaskStatus)
        ? (overId as TaskStatus)
        : null);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setTasks((prev) => {
      const activeTask = prev.find((t) => t.id === active.id);
      if (!activeTask) {
        return prev;
      }

      const without = prev.filter((t) => t.id !== active.id);
      const overTasks = sortTasks(
        without.filter((t) => t.status === overContainer),
      );
      const overIndex = overTasks.findIndex((t) => t.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : overTasks.length;

      const moved: KanbanTask = {
        ...activeTask,
        status: overContainer,
        position: insertAt,
      };

      const nextOver = [...overTasks];
      nextOver.splice(insertAt, 0, moved);

      const reindexed = nextOver.map((t, i) => ({ ...t, position: i }));
      const other = without.filter((t) => t.status !== overContainer);

      return [...other, ...reindexed];
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) {
      return;
    }

    const activeIdStr = String(active.id);
    const overId = String(over.id);

    setTasks((prev) => {
      const current = prev.find((t) => t.id === activeIdStr);
      if (!current) {
        return prev;
      }

      const container = current.status;
      const columnTasks = sortTasks(prev.filter((t) => t.status === container));
      const oldIndex = columnTasks.findIndex((t) => t.id === activeIdStr);
      let newIndex = columnTasks.findIndex((t) => t.id === overId);
      if (newIndex < 0) {
        newIndex = columnTasks.length - 1;
      }
      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }

      const reordered = arrayMove(columnTasks, oldIndex, newIndex).map(
        (t, i) => ({ ...t, position: i }),
      );
      const other = prev.filter((t) => t.status !== container);
      const next = [...other, ...reordered];

      const moved = reordered.find((t) => t.id === activeIdStr);
      if (moved) {
        startTransition(async () => {
          await moveTask({
            homeId,
            taskId: moved.id,
            status: moved.status,
            position: moved.position,
          });
          router.refresh();
        });
      }

      return next;
    });
  }

  const board = (
    <div
      ref={boardRef}
      className="kanban-board"
      onScroll={onBoardScroll}
    >
      {TASK_STATUSES.map((status) =>
        dndReady ? (
          <Column key={status} status={status} tasks={columns[status]} />
        ) : (
          <Box
            key={status}
            className="kanban-column"
            style={{
              ["--col-accent" as string]: COLUMN_META[status].accent,
            }}
          >
            <Group justify="space-between" mb="sm" wrap="nowrap">
              <Text fw={600} size="sm">
                {COLUMN_META[status].label}
              </Text>
              <span className={`status-badge status-badge--${status}`}>
                {columns[status].length}
              </span>
            </Group>
            <Stack gap={8} mih={48}>
              {columns[status].map((task) => (
                <Box key={task.id} className="task-card">
                  <Text fw={550} size="sm" lh={1.35}>
                    {task.title}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Box>
        ),
      )}
    </div>
  );

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

      {dndReady ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          {board}
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} dragging /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        board
      )}

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

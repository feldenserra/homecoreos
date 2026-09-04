import { supabase } from "../supabase";
import type { TaskStatus } from "../types";
import { messageFromError } from "./errors";

/** First page for paged task lists (simple completed, kanban not-started / complete). */
export const TASK_PAGE_FIRST = 10;
/** Subsequent pages. */
export const TASK_PAGE_NEXT = 20;

export const PAGED_KANBAN_STATUSES = ["not_started", "complete"] as const;
export type PagedKanbanStatus = (typeof PAGED_KANBAN_STATUSES)[number];

export function isPagedKanbanStatus(
  status: TaskStatus,
): status is PagedKanbanStatus {
  return (PAGED_KANBAN_STATUSES as readonly string[]).includes(status);
}

/**
 * The kanban board's data layer. Replaces the task half of app/app/actions.ts.
 *
 * All direct client queries: `task_*` policies gate every statement on
 * is_home_member("homeId"), the CHECK constraints hold the validation the
 * server actions used to do, and the guard trigger stops a task being moved
 * between households.
 */

export type Task = {
  id: string;
  homeId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  createdByUserId: string;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listTasks(homeId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("task")
    .select("*")
    .eq("homeId", homeId)
    .order("status", { ascending: true })
    .order("position", { ascending: true })
    .order("createdAt", { ascending: true });

  if (error) {
    throw new Error(messageFromError(error, "Could not load tasks."));
  }

  return data as Task[];
}

/** Open checklist rows, newest first. Used by the simple Tasks view. */
export async function listOpenTasks(homeId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("task")
    .select("*")
    .eq("homeId", homeId)
    .neq("status", "complete")
    .order("createdAt", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw new Error(messageFromError(error, "Could not load tasks."));
  }

  return data as Task[];
}

/**
 * One status column, ordered by kanban position. Used to page Not started and
 * Complete on the advanced board.
 */
export async function listTasksByStatus(
  homeId: string,
  input: { status: TaskStatus; offset: number; limit: number },
): Promise<Task[]> {
  const from = input.offset;
  const to = input.offset + input.limit - 1;
  const { data, error } = await supabase
    .from("task")
    .select("*")
    .eq("homeId", homeId)
    .eq("status", input.status)
    .order("position", { ascending: true })
    .order("createdAt", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(messageFromError(error, "Could not load tasks."));
  }

  return data as Task[];
}

/**
 * Advanced board: every in-progress and stuck row, plus the first page of
 * Not started and Complete.
 */
export async function listKanbanTasks(homeId: string): Promise<Task[]> {
  const [core, notStarted, complete] = await Promise.all([
    supabase
      .from("task")
      .select("*")
      .eq("homeId", homeId)
      .in("status", ["in_progress", "stuck"])
      .order("status", { ascending: true })
      .order("position", { ascending: true })
      .order("createdAt", { ascending: true }),
    listTasksByStatus(homeId, {
      status: "not_started",
      offset: 0,
      limit: TASK_PAGE_FIRST,
    }),
    listTasksByStatus(homeId, {
      status: "complete",
      offset: 0,
      limit: TASK_PAGE_FIRST,
    }),
  ]);

  if (core.error) {
    throw new Error(messageFromError(core.error, "Could not load tasks."));
  }

  return [...notStarted, ...(core.data as Task[]), ...complete];
}

/** Completed checklist page, most recently completed first. */
export async function listCompletedTasks(
  homeId: string,
  input: { offset: number; limit: number },
): Promise<Task[]> {
  const from = input.offset;
  const to = input.offset + input.limit - 1;
  const { data, error } = await supabase
    .from("task")
    .select("*")
    .eq("homeId", homeId)
    .eq("status", "complete")
    .order("updatedAt", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(messageFromError(error, "Could not load completed tasks."));
  }

  return data as Task[];
}

/**
 * An RPC rather than an insert so `max(position) + 1` and the insert are one
 * statement. It is still SECURITY INVOKER, so RLS and the CHECKs apply
 * unchanged — the atomicity is the only thing being bought.
 */
export async function createTask(input: {
  homeId: string;
  title: string;
  status?: TaskStatus;
  description?: string | null;
}): Promise<Task> {
  const { data, error } = await supabase.rpc("create_task", {
    p_home_id: input.homeId,
    p_title: input.title,
    p_status: input.status ?? "not_started",
    p_description: input.description ?? null,
  });

  if (error || !data) {
    throw new Error(messageFromError(error, "Could not add task."));
  }

  return data as Task;
}

export async function moveTask(input: {
  homeId: string;
  taskId: string;
  status: TaskStatus;
  position: number;
}): Promise<void> {
  const { error } = await supabase
    .from("task")
    .update({ status: input.status, position: input.position })
    .eq("id", input.taskId)
    // Redundant under RLS, but it keeps a wrong id from touching another of the
    // caller's own homes.
    .eq("homeId", input.homeId);

  if (error) {
    throw new Error(messageFromError(error, "Could not move task."));
  }
}

export async function deleteTask(input: {
  homeId: string;
  taskId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("task")
    .delete()
    .eq("id", input.taskId)
    .eq("homeId", input.homeId);

  if (error) {
    throw new Error(messageFromError(error, "Could not delete task."));
  }
}

export async function assignTask(input: {
  homeId: string;
  taskId: string;
  assignedToUserId: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from("task")
    .update({ assignedToUserId: input.assignedToUserId })
    .eq("id", input.taskId)
    .eq("homeId", input.homeId);

  if (error) {
    throw new Error(messageFromError(error, "Could not assign that task."));
  }
}

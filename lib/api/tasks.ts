import { supabase } from "../supabase";
import type { TaskStatus } from "../types";
import { messageFromError } from "./errors";

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

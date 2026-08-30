"use server";

import { and, asc, eq, max, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import {
  generateHomeId,
  isValidHomeId,
  MAX_CREATED_HOMES,
  MAX_JOINED_HOMES,
  normalizeHomeId,
} from "../../lib/home-id";
import { withRls } from "../../src/db/rls";
import {
  homeMembers,
  homes,
  tasks,
} from "../../src/db/schema";
import { TASK_STATUSES, type TaskStatus } from "../../lib/types";

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

export type ActionResult = { error: string } | { ok: true };

export type HomeQuota = {
  createdCount: number;
  joinedCount: number;
};

function scalarCount(row: { count?: unknown } | undefined): number {
  const n = Number(row?.count ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function pgErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: unknown }).code);
  }
  return undefined;
}

function pgConstraint(err: unknown): string {
  if (!err || typeof err !== "object") {
    return "";
  }
  const e = err as { constraint_name?: unknown; constraint?: unknown };
  return String(e.constraint_name ?? e.constraint ?? "");
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err ?? "");
}

function isAlreadyCreatedError(err: unknown): boolean {
  const code = pgErrorCode(err);
  const constraint = pgConstraint(err);
  const message = errorMessage(err);
  if (code === "42501" || message.includes("row-level security")) {
    return true;
  }
  if (code === "23505" && constraint.includes("home_one_per_creator")) {
    return true;
  }
  return message.includes("home_one_per_creator");
}

function isHomeIdCollision(err: unknown): boolean {
  if (pgErrorCode(err) !== "23505") {
    return false;
  }
  const constraint = pgConstraint(err);
  return constraint.includes("home_pkey") || constraint === "home_id";
}

export async function getHomeQuota(userId: string): Promise<HomeQuota> {
  return withRls(userId, async (tx) => {
    const rows = await tx.execute(
      sql`select user_created_home_count() as created, user_joined_home_count() as joined`,
    );
    const row = rows[0] as { created?: unknown; joined?: unknown } | undefined;
    return {
      createdCount: scalarCount({ count: row?.created }),
      joinedCount: scalarCount({ count: row?.joined }),
    };
  });
}

export async function createHome(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    return { error: "Give your home a name (at least 2 characters)." };
  }
  if (name.length > 64) {
    return { error: "Home name must be 64 characters or fewer." };
  }

  const quota = await getHomeQuota(userId);
  if (quota.createdCount >= MAX_CREATED_HOMES) {
    return { error: "You can only create one home." };
  }

  let homeId = "";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateHomeId();
    try {
      await withRls(userId, async (tx) => {
        await tx.insert(homes).values({
          id: candidate,
          name,
          createdByUserId: userId,
        });
        await tx.insert(homeMembers).values({
          homeId: candidate,
          userId,
          role: "owner",
        });
      });
      homeId = candidate;
      break;
    } catch (err) {
      if (isAlreadyCreatedError(err)) {
        return { error: "You can only create one home." };
      }
      if (isHomeIdCollision(err) || pgErrorCode(err) === "23505") {
        continue;
      }
      return { error: "Could not create a home. Try again." };
    }
  }

  if (!homeId) {
    return { error: "Could not create a home. Try again." };
  }

  redirect(`/app/${homeId}/home`);
}

export async function joinHome(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const homeId = normalizeHomeId(String(formData.get("code") ?? ""));

  if (!isValidHomeId(homeId)) {
    return { error: "Enter a valid 8- or 12-character home code." };
  }

  const result = await withRls(userId, async (tx) => {
    const existsResult = await tx.execute(
      sql`select home_exists(${homeId}) as ok`,
    );
    const existsRow = existsResult[0] as { ok: boolean | string } | undefined;
    const exists =
      existsRow?.ok === true ||
      existsRow?.ok === "t" ||
      existsRow?.ok === "true";
    if (!exists) {
      return { error: "No home found with that code." } as const;
    }

    const [existing] = await tx
      .select({ homeId: homeMembers.homeId })
      .from(homeMembers)
      .where(
        and(eq(homeMembers.homeId, homeId), eq(homeMembers.userId, userId)),
      )
      .limit(1);

    if (existing) {
      return { already: true } as const;
    }

    const joinedRows = await tx.execute(
      sql`select user_joined_home_count() as count`,
    );
    const joinedCount = scalarCount(
      joinedRows[0] as { count?: unknown } | undefined,
    );
    if (joinedCount >= MAX_JOINED_HOMES) {
      return {
        error: "You can join at most 5 other homes.",
      } as const;
    }

    try {
      await tx.insert(homeMembers).values({
        homeId,
        userId,
        role: "member",
      });
    } catch (err) {
      if (
        pgErrorCode(err) === "42501" ||
        errorMessage(err).includes("row-level security")
      ) {
        return { error: "You can join at most 5 other homes." } as const;
      }
      throw err;
    }

    return { joined: true } as const;
  });

  if ("error" in result) {
    return { error: result.error ?? "Could not join home." };
  }

  redirect(`/app/${homeId}/home`);
}

export async function createTask(
  homeId: string,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "").trim();

  if (!isValidHomeId(homeId)) {
    return { error: "Invalid home." };
  }
  if (title.length < 1) {
    return { error: "Task title is required." };
  }
  if (title.length > 200) {
    return { error: "Title must be 200 characters or fewer." };
  }

  await withRls(userId, async (tx) => {
    const [membership] = await tx
      .select({ homeId: homeMembers.homeId })
      .from(homeMembers)
      .where(
        and(eq(homeMembers.homeId, homeId), eq(homeMembers.userId, userId)),
      )
      .limit(1);

    if (!membership) {
      throw new Error("Not a member");
    }

    const statusRaw = String(formData.get("status") ?? "not_started");
    const status = TASK_STATUSES.includes(statusRaw as TaskStatus)
      ? (statusRaw as TaskStatus)
      : "not_started";

    const [agg] = await tx
      .select({ maxPos: max(tasks.position) })
      .from(tasks)
      .where(and(eq(tasks.homeId, homeId), eq(tasks.status, status)));

    const nextPos = (agg?.maxPos ?? -1) + 1;

    await tx.insert(tasks).values({
      homeId,
      title,
      status,
      position: nextPos,
      createdByUserId: userId,
    });
  });

  return { ok: true };
}

export async function moveTask(input: {
  homeId: string;
  taskId: string;
  status: TaskStatus;
  position: number;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const { homeId, taskId, status, position } = input;

  if (!isValidHomeId(homeId)) {
    return { error: "Invalid home." };
  }
  if (!TASK_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }
  if (!Number.isFinite(position) || position < 0) {
    return { error: "Invalid position." };
  }

  try {
    await withRls(userId, async (tx) => {
      const [task] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.homeId, homeId)))
        .limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      await tx
        .update(tasks)
        .set({
          status,
          position,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));
    });
  } catch {
    return { error: "Could not move task." };
  }

  return { ok: true };
}

export async function deleteTask(input: {
  homeId: string;
  taskId: string;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const { homeId, taskId } = input;

  if (!isValidHomeId(homeId)) {
    return { error: "Invalid home." };
  }
  if (!taskId.trim()) {
    return { error: "Invalid task." };
  }

  try {
    await withRls(userId, async (tx) => {
      const [task] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.homeId, homeId)))
        .limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      await tx
        .delete(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.homeId, homeId)));
    });
  } catch {
    return { error: "Could not delete task." };
  }

  return { ok: true };
}

export async function getHomesForUser(userId: string) {
  return withRls(userId, async (tx) =>
    tx
      .select({
        id: homes.id,
        name: homes.name,
        role: homeMembers.role,
      })
      .from(homeMembers)
      .innerJoin(homes, eq(homes.id, homeMembers.homeId))
      .where(eq(homeMembers.userId, userId))
      .orderBy(asc(homes.name)),
  );
}

export async function getHomeForMember(userId: string, homeId: string) {
  return withRls(userId, async (tx) => {
    const [row] = await tx
      .select({
        id: homes.id,
        name: homes.name,
        role: homeMembers.role,
      })
      .from(homeMembers)
      .innerJoin(homes, eq(homes.id, homeMembers.homeId))
      .where(
        and(eq(homeMembers.homeId, homeId), eq(homeMembers.userId, userId)),
      )
      .limit(1);
    return row ?? null;
  });
}

export async function getTasksForHome(userId: string, homeId: string) {
  return withRls(userId, async (tx) =>
    tx
      .select()
      .from(tasks)
      .where(eq(tasks.homeId, homeId))
      .orderBy(asc(tasks.status), asc(tasks.position), asc(tasks.createdAt)),
  );
}

import type { HomeMemberRole } from "../types";
import { supabase } from "../supabase";
import { messageFromError } from "./errors";

/**
 * Households. Replaces the home half of app/app/actions.ts.
 *
 * Reads are direct client queries — RLS scopes them, and `home_select` already
 * requires membership so there is nothing left to check in code. Writes go
 * through RPCs, because creating and joining are each two statements that must
 * be atomic, and because direct INSERT on home_member is revoked so the join
 * code stays the only way into a household.
 */

export type HomeSummary = {
  id: string;
  name: string;
  code: string;
  role: HomeMemberRole;
};

export type HomeQuota = {
  createdCount: number;
  joinedCount: number;
};

export type HomeMemberProfile = {
  userId: string;
  role: HomeMemberRole;
  name: string | null;
  email: string | null;
  image: string | null;
};

type MembershipRow = {
  role: string;
  home: { id: string; name: string; code: string } | null;
};

type MemberListRow = {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

/**
 * home_member_select now returns every housemate, so queries that used to rely
 * on "RLS = only my row" must name the caller. The id comes from the session,
 * not from the caller of this module.
 */
async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("You are not signed in.");
  }
  return data.user.id;
}

function toSummary(row: MembershipRow): HomeSummary | null {
  return row.home
    ? {
        id: row.home.id,
        name: row.home.name,
        code: row.home.code,
        // `role` is a text column constrained by home_member_role_check, so the
        // database guarantees the narrowing the type cannot express.
        role: row.role as HomeMemberRole,
      }
    : null;
}

export async function listHomes(): Promise<HomeSummary[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("home_member")
    .select("role, home(id, name, code)")
    .eq("userId", userId)
    .order("name", { referencedTable: "home", ascending: true });

  if (error) {
    throw new Error(messageFromError(error, "Could not load your homes."));
  }

  return (data as MembershipRow[])
    .map(toSummary)
    .filter((home): home is HomeSummary => home !== null);
}

export async function getHomeMembership(
  homeId: string,
): Promise<HomeSummary | null> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("home_member")
    .select("role, home(id, name, code)")
    .eq("homeId", homeId)
    .eq("userId", userId)
    .limit(1);

  if (error) {
    throw new Error(messageFromError(error, "Could not load that home."));
  }

  const row = (data as MembershipRow[])[0];
  return row ? toSummary(row) : null;
}

export async function getHomeQuota(): Promise<HomeQuota> {
  const [created, joined] = await Promise.all([
    supabase.rpc("user_created_home_count"),
    supabase.rpc("user_joined_home_count"),
  ]);

  if (created.error || joined.error) {
    throw new Error(
      messageFromError(
        created.error ?? joined.error,
        "Could not load your home limits.",
      ),
    );
  }

  return {
    createdCount: Number(created.data ?? 0),
    joinedCount: Number(joined.data ?? 0),
  };
}

/**
 * The name check, the one-home-per-user quota and the join-code collision retry
 * all live inside the RPC, which raises PT4xx with the message to display.
 */
export async function createHome(name: string): Promise<HomeSummary> {
  // `create_home` RETURNS public.home rather than SETOF, so PostgREST answers
  // with the object itself — no .select().single() to unwrap.
  const { data, error } = await supabase.rpc("create_home", { p_name: name });

  if (error || !data) {
    throw new Error(messageFromError(error, "Could not create a home."));
  }

  return { id: data.id, name: data.name, code: data.code, role: "owner" };
}

export async function joinHome(code: string): Promise<HomeSummary> {
  const { data, error } = await supabase.rpc("join_home", { p_code: code });

  if (error || !data) {
    throw new Error(messageFromError(error, "Could not join that home."));
  }

  // join_home is idempotent, so this may be a home the caller already owns —
  // read the role back rather than assuming "member".
  const userId = await currentUserId();
  const { data: memberRows } = await supabase
    .from("home_member")
    .select("role")
    .eq("homeId", data.id)
    .eq("userId", userId)
    .limit(1);

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    role: (memberRows?.[0]?.role as HomeMemberRole) ?? "member",
  };
}

/** Owners cannot leave — the RLS policy blocks it, so the UI should hide it. */
export async function leaveHome(homeId: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from("home_member")
    .delete()
    .eq("homeId", homeId)
    .eq("userId", userId);

  if (error) {
    throw new Error(messageFromError(error, "Could not leave that home."));
  }
}

export async function listHomeMembers(
  homeId: string,
): Promise<HomeMemberProfile[]> {
  const { data, error } = await supabase
    .from("home_member")
    .select("userId, role, user(id, name, email, image)")
    .eq("homeId", homeId)
    .order("joinedAt", { ascending: true });

  if (error) {
    throw new Error(messageFromError(error, "Could not load household members."));
  }

  return ((data as MemberListRow[]) ?? []).flatMap((row) =>
    row.user
      ? [
          {
            userId: row.userId,
            role: row.role as HomeMemberRole,
            name: row.user.name,
            email: row.user.email,
            image: row.user.image,
          },
        ]
      : [],
  );
}

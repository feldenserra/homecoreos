-- Task assignees and housemate visibility.
--
-- Assignment needs two things the original schema withheld:
--   1. A column on task, constrained so the assignee is a member of that home.
--   2. SELECT on housemates' home_member and user rows. The original policies
--      were self-only, which is why there was no member list. Widening
--      home_member_select uses is_home_member() (SECURITY DEFINER) rather than
--      an inline EXISTS, or the policy recurses (42P17). user_select uses a
--      new shares_home_with() helper for the same reason.

ALTER TABLE "task" ADD COLUMN "assignedToUserId" uuid;
--> statement-breakpoint

ALTER TABLE "task" ADD CONSTRAINT "task_assignedToUserId_user_id_fk"
  FOREIGN KEY ("assignedToUserId") REFERENCES "public"."user"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- MATCH SIMPLE (the default): a null assignee skips the check. Leaving the
-- house deletes the home_member row and clears the assignment.
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_home_member_fk"
  FOREIGN KEY ("homeId", "assignedToUserId")
  REFERENCES "public"."home_member"("homeId", "userId")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- shares_home_with
-- ---------------------------------------------------------------------------
--
-- True when the caller and p_user_id share at least one household. SECURITY
-- DEFINER so user_select can ask this without being able to read home_member
-- rows it does not yet have a policy for (chicken-and-egg during the rewrite).

CREATE OR REPLACE FUNCTION public.shares_home_with(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.home_member mine
    JOIN public.home_member theirs ON mine."homeId" = theirs."homeId"
    WHERE mine."userId" = auth.uid()
      AND theirs."userId" = p_user_id
  );
$$;
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS home_member_select ON public.home_member;
--> statement-breakpoint
CREATE POLICY home_member_select ON public.home_member FOR SELECT TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint

DROP POLICY IF EXISTS user_select ON public."user";
--> statement-breakpoint
CREATE POLICY user_select ON public."user" FOR SELECT TO authenticated
  USING (
    id = (select auth.uid())
    OR public.shares_home_with(id)
  );
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.shares_home_with(uuid) FROM public;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.shares_home_with(uuid) TO authenticated;
--> statement-breakpoint

NOTIFY pgrst, 'reload schema';

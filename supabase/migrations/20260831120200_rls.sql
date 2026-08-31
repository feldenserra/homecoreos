-- Row-level security, helper functions, RPCs, and triggers.
--
-- Ported from drizzle/0001_dry_cerebro.sql, 0002_massive_killraven.sql,
-- 0003_home_limits.sql and 0005_user_ai_key.sql. Three things changed:
--
--   1. Identity comes from `(select auth.uid())` instead of
--      `current_setting('app.user_id')`. The subselect form lets the planner
--      hoist it into an InitPlan, evaluated once per query rather than per row.
--   2. Every policy is scoped `TO authenticated`. Without that they are also
--      evaluated for `anon`.
--   3. Every UPDATE policy now has an explicit WITH CHECK. The originals had
--      only USING, which gates the row you may touch but says nothing about
--      what you may turn it into.
--
-- `FORCE ROW LEVEL SECURITY` from the originals is deliberately not carried
-- over: it is ignored for `postgres` and `service_role` (both hold BYPASSRLS),
-- so on Supabase it buys nothing while complicating dumps and Realtime.


-- ---------------------------------------------------------------------------
-- Profile provisioning
-- ---------------------------------------------------------------------------

-- Mirrors a new auth.users row into public."user".
--
-- Every failure mode here is a signup outage: this runs inside the auth.users
-- INSERT, so a raise rolls that back and the client sees
-- "500 Database error saving new user". Hence ON CONFLICT DO NOTHING, a
-- nullable non-unique email, and no assumptions about metadata shape.
--
-- GitHub sends name/full_name/user_name/avatar_url; email signup sends almost
-- nothing. Both are handled by coalescing rather than by branching on provider.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public."user" (id, name, email, image)
  VALUES (
    NEW.id,
    nullif(btrim(coalesce(
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'user_name',
      ''
    )), ''),
    NEW.email,
    nullif(btrim(coalesce(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'image',
      ''
    )), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Column guards
-- ---------------------------------------------------------------------------

-- `updatedAt` used to be set by server actions. Clients can write it now, and
-- chat_conversation_home_updated_idx orders the conversation list by it, so
-- without this a client can pin its own chat to the top forever.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW."updatedAt" := now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint

-- Rejects UPDATEs that change any column named in the trigger's arguments.
--
-- This is what actually stops a task being moved between households. A policy
-- WITH CHECK cannot express it: WITH CHECK sees only the new row, so
-- `is_home_member("homeId")` still passes for someone who belongs to both
-- homes. Comparing old to new needs a trigger.
CREATE OR REPLACE FUNCTION public.guard_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  old_row jsonb := to_jsonb(OLD);
  new_row jsonb := to_jsonb(NEW);
  col text;
BEGIN
  FOREACH col IN ARRAY TG_ARGV LOOP
    IF old_row -> col IS DISTINCT FROM new_row -> col THEN
      RAISE EXCEPTION '%.% cannot be changed', TG_TABLE_NAME, col
        USING ERRCODE = 'PT403';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER home_guard_immutable BEFORE UPDATE ON public.home
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'code', 'createdByUserId', 'createdAt');
--> statement-breakpoint
CREATE TRIGGER home_set_updated_at BEFORE UPDATE ON public.home
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint

CREATE TRIGGER home_member_guard_immutable BEFORE UPDATE ON public.home_member
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'homeId', 'userId', 'role', 'joinedAt');
--> statement-breakpoint

CREATE TRIGGER task_guard_immutable BEFORE UPDATE ON public.task
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'homeId', 'createdByUserId', 'createdAt');
--> statement-breakpoint
CREATE TRIGGER task_set_updated_at BEFORE UPDATE ON public.task
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint

CREATE TRIGGER chat_conversation_guard_immutable BEFORE UPDATE ON public.chat_conversation
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'homeId', 'createdByUserId', 'createdAt');
--> statement-breakpoint
CREATE TRIGGER chat_conversation_set_updated_at BEFORE UPDATE ON public.chat_conversation
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint

CREATE TRIGGER chat_message_guard_immutable BEFORE UPDATE ON public.chat_message
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'conversationId', 'homeId', 'createdAt');
--> statement-breakpoint

CREATE TRIGGER user_ai_key_guard_immutable BEFORE UPDATE ON public.user_ai_key
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'userId', 'createdAt');
--> statement-breakpoint
CREATE TRIGGER user_ai_key_set_updated_at BEFORE UPDATE ON public.user_ai_key
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Membership helpers
-- ---------------------------------------------------------------------------
--
-- All SECURITY DEFINER and STABLE. They are SECURITY DEFINER for two reasons:
-- they must count rows the caller cannot see, and an inline
-- `EXISTS (SELECT 1 FROM home_member ...)` inside a policy *on* home_member
-- raises 42P17 infinite recursion.

CREATE OR REPLACE FUNCTION public.is_home_member(p_home_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.home_member
    WHERE "homeId" = p_home_id AND "userId" = auth.uid()
  );
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.is_home_owner(p_home_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.home_member
    WHERE "homeId" = p_home_id AND "userId" = auth.uid() AND role = 'owner'
  );
$$;
--> statement-breakpoint

-- Kept under their original names: the home picker calls both over rpc().
CREATE OR REPLACE FUNCTION public.user_created_home_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT count(*)::integer FROM public.home WHERE "createdByUserId" = auth.uid();
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.user_joined_home_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT count(*)::integer FROM public.home_member
  WHERE "userId" = auth.uid() AND role = 'member';
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.home_created_by_current_user(p_home_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.home
    WHERE id = p_home_id AND "createdByUserId" = auth.uid()
  );
$$;
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Creating a home is two inserts that must both land or neither. PostgREST
-- wraps each request in one transaction, so an RPC gives that for free.
--
-- SECURITY DEFINER because direct INSERT on home and home_member is revoked
-- from `authenticated` (see the grants at the end, and the note on join_home).
-- That means RLS is off inside this function — Supabase function owners hold
-- BYPASSRLS — so the "one created home per user" quota is enforced here in
-- plpgsql rather than delegated to home_insert's WITH CHECK.
CREATE OR REPLACE FUNCTION public.create_home(p_name text)
RETURNS public.home
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_home public.home;
  v_constraint text;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sign in to create a home.' USING ERRCODE = 'PT401';
  END IF;
  IF char_length(v_name) < 2 THEN
    RAISE EXCEPTION 'Give your home a name (at least 2 characters).'
      USING ERRCODE = 'PT400';
  END IF;
  IF char_length(v_name) > 64 THEN
    RAISE EXCEPTION 'Home name must be 64 characters or fewer.'
      USING ERRCODE = 'PT400';
  END IF;
  IF EXISTS (SELECT 1 FROM public.home WHERE "createdByUserId" = v_user) THEN
    RAISE EXCEPTION 'You can only create one home.' USING ERRCODE = 'PT409';
  END IF;

  -- Retry the join-code collision, and only that. home_one_per_creator raises
  -- unique_violation too; retrying it would spin eight times and then report
  -- the wrong error, so discriminate on the constraint name and re-raise
  -- anything else.
  FOR i IN 1..8 LOOP
    BEGIN
      INSERT INTO public.home (name, "createdByUserId")
      VALUES (v_name, v_user)
      RETURNING * INTO v_home;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
      IF v_constraint IS DISTINCT FROM 'home_code_key' THEN
        RAISE;
      END IF;
      v_home := NULL;
    END;
  END LOOP;

  IF v_home.id IS NULL THEN
    RAISE EXCEPTION 'Could not create a home. Try again.' USING ERRCODE = 'PT409';
  END IF;

  INSERT INTO public.home_member ("homeId", "userId", role)
  VALUES (v_home.id, v_user, 'owner');

  RETURN v_home;
END;
$$;
--> statement-breakpoint

-- The only way into a household.
--
-- Before this migration `home.id` *was* the join code, so supplying a homeId to
-- home_member_insert was itself proof that you knew the secret and the policy
-- needed no further check. Now that the id is a uuid that appears in routes,
-- deep links and logs, that proof is gone — so direct INSERT on home_member is
-- revoked and this function, which demands the code, is the sole entry point.
--
-- Idempotent: re-joining a home you are already in returns it, matching the old
-- action's "already a member" branch.
CREATE OR REPLACE FUNCTION public.join_home(p_code text)
RETURNS public.home
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text;
  v_home public.home;
  v_joined integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sign in to join a home.' USING ERRCODE = 'PT401';
  END IF;

  -- normalizeHomeId(): uppercase, then drop anything outside the charset.
  v_code := regexp_replace(
    upper(btrim(coalesce(p_code, ''))),
    '[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]', '', 'g');

  IF v_code !~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$' THEN
    RAISE EXCEPTION 'Enter a valid 12-character home code.' USING ERRCODE = 'PT400';
  END IF;

  SELECT * INTO v_home FROM public.home WHERE code = v_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No home found with that code.' USING ERRCODE = 'PT404';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.home_member
    WHERE "homeId" = v_home.id AND "userId" = v_user
  ) THEN
    RETURN v_home;
  END IF;

  SELECT count(*)::integer INTO v_joined
  FROM public.home_member
  WHERE "userId" = v_user AND role = 'member';

  IF v_joined >= 5 THEN
    RAISE EXCEPTION 'You can join at most 5 other homes.' USING ERRCODE = 'PT409';
  END IF;

  INSERT INTO public.home_member ("homeId", "userId", role)
  VALUES (v_home.id, v_user, 'member');

  RETURN v_home;
END;
$$;
--> statement-breakpoint

-- Appends a task at the end of its status column.
--
-- SECURITY INVOKER, unlike the two above: `authenticated` keeps INSERT on task,
-- so RLS and the CHECK constraints both still apply and there is nothing to
-- re-implement. The only reason this is an RPC at all is to compute
-- max(position) + 1 in the same statement as the insert.
CREATE OR REPLACE FUNCTION public.create_task(
  p_home_id uuid,
  p_title text,
  p_status text DEFAULT 'not_started',
  p_description text DEFAULT NULL
)
RETURNS public.task
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_status text := coalesce(nullif(btrim(coalesce(p_status, '')), ''), 'not_started');
  v_task public.task;
BEGIN
  -- Unknown status falls back rather than erroring, matching createTask.
  IF v_status NOT IN ('not_started', 'in_progress', 'stuck', 'complete') THEN
    v_status := 'not_started';
  END IF;

  INSERT INTO public.task ("homeId", title, description, status, position)
  SELECT
    p_home_id,
    btrim(coalesce(p_title, '')),
    nullif(btrim(coalesce(p_description, '')), ''),
    v_status,
    coalesce(max(position) + 1, 0)
  FROM public.task
  WHERE "homeId" = p_home_id AND status = v_status
  RETURNING * INTO v_task;

  RETURN v_task;
END;
$$;
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.home ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.home_member ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.task ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.chat_conversation ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.chat_message ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.user_ai_key ENABLE ROW LEVEL SECURITY;--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Policies: user
-- ---------------------------------------------------------------------------
--
-- The pre-Supabase schema had no RLS on this table at all, which was safe only
-- because nothing but the Next.js server could reach it. Over PostgREST, a
-- table with RLS disabled is readable by `anon` with only the publishable key:
-- GET /rest/v1/user?select=* would return every name and email.
--
-- There is no INSERT policy (the signup trigger owns that) and no DELETE policy
-- (the FK to auth.users cascades).

CREATE POLICY user_select ON public."user" FOR SELECT TO authenticated
  USING (id = (select auth.uid()));
--> statement-breakpoint
CREATE POLICY user_update ON public."user" FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Policies: home
-- ---------------------------------------------------------------------------
--
-- No DELETE policy, carried over deliberately: homes have never been deletable
-- through the app connection.

CREATE POLICY home_select ON public.home FOR SELECT TO authenticated
  USING (public.is_home_member(id));
--> statement-breakpoint

-- Defence in depth only — INSERT is revoked from `authenticated` and
-- create_home() is the real gate. Kept so that re-granting the privilege later
-- does not silently drop the quota.
CREATE POLICY home_insert ON public.home FOR INSERT TO authenticated
  WITH CHECK (
    "createdByUserId" = (select auth.uid())
    AND public.user_created_home_count() = 0
  );
--> statement-breakpoint

CREATE POLICY home_update ON public.home FOR UPDATE TO authenticated
  USING (public.is_home_owner(id))
  WITH CHECK (public.is_home_owner(id));
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Policies: home_member
-- ---------------------------------------------------------------------------

-- Note this is `= auth.uid()`, not "same home": a member sees only their own
-- membership row, never their housemates'. That is the existing behaviour and
-- it is why there is no member list in the app. Widening it needs a policy over
-- is_home_member(), not an inline EXISTS, or it recurses.
CREATE POLICY home_member_select ON public.home_member FOR SELECT TO authenticated
  USING ("userId" = (select auth.uid()));
--> statement-breakpoint

-- Defence in depth only; INSERT is revoked and join_home() is the real gate.
CREATE POLICY home_member_insert ON public.home_member FOR INSERT TO authenticated
  WITH CHECK (
    "userId" = (select auth.uid())
    AND (
      (role = 'owner' AND public.home_created_by_current_user("homeId"))
      OR
      (role = 'member' AND public.user_joined_home_count() < 5)
    )
  );
--> statement-breakpoint

-- Self-leave, except for owners. An owner who deleted their own membership row
-- would lose home_select on their own home while home_one_per_creator kept them
-- from making another: a permanently stuck account.
CREATE POLICY home_member_delete ON public.home_member FOR DELETE TO authenticated
  USING ("userId" = (select auth.uid()) AND role <> 'owner');
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Policies: task
-- ---------------------------------------------------------------------------

CREATE POLICY task_select ON public.task FOR SELECT TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY task_insert ON public.task FOR INSERT TO authenticated
  WITH CHECK (
    public.is_home_member("homeId")
    AND "createdByUserId" = (select auth.uid())
  );
--> statement-breakpoint
CREATE POLICY task_update ON public.task FOR UPDATE TO authenticated
  USING (public.is_home_member("homeId"))
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY task_delete ON public.task FOR DELETE TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Policies: chat_conversation
-- ---------------------------------------------------------------------------
--
-- Writes stay granted to `authenticated` because the chat and conversations
-- Edge Functions connect with the caller's own JWT — revoking here would lock
-- them out too. Confidentiality rests on the encryption key never leaving the
-- function, plus the enc:v1: CHECK constraints, which make a client that lacks
-- the key unable to write a value that will ever decrypt.

CREATE POLICY chat_conversation_select ON public.chat_conversation FOR SELECT TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY chat_conversation_insert ON public.chat_conversation FOR INSERT TO authenticated
  WITH CHECK (
    public.is_home_member("homeId")
    AND "createdByUserId" = (select auth.uid())
  );
--> statement-breakpoint
CREATE POLICY chat_conversation_update ON public.chat_conversation FOR UPDATE TO authenticated
  USING (public.is_home_member("homeId"))
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY chat_conversation_delete ON public.chat_conversation FOR DELETE TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Policies: chat_message
-- ---------------------------------------------------------------------------

CREATE POLICY chat_message_select ON public.chat_message FOR SELECT TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY chat_message_insert ON public.chat_message FOR INSERT TO authenticated
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY chat_message_update ON public.chat_message FOR UPDATE TO authenticated
  USING (public.is_home_member("homeId"))
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY chat_message_delete ON public.chat_message FOR DELETE TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Policies: user_ai_key
-- ---------------------------------------------------------------------------
--
-- Per-user, never home-scoped.

CREATE POLICY user_ai_key_select ON public.user_ai_key FOR SELECT TO authenticated
  USING ("userId" = (select auth.uid()));
--> statement-breakpoint
CREATE POLICY user_ai_key_insert ON public.user_ai_key FOR INSERT TO authenticated
  WITH CHECK ("userId" = (select auth.uid()));
--> statement-breakpoint
CREATE POLICY user_ai_key_update ON public.user_ai_key FOR UPDATE TO authenticated
  USING ("userId" = (select auth.uid()))
  WITH CHECK ("userId" = (select auth.uid()));
--> statement-breakpoint
CREATE POLICY user_ai_key_delete ON public.user_ai_key FOR DELETE TO authenticated
  USING ("userId" = (select auth.uid()));
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
--
-- RLS filters rows; privileges decide whether you may reach the table at all.
-- Both are needed, and Supabase's default grants are broad, so the interesting
-- lines here are the REVOKEs.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
--> statement-breakpoint

-- Nothing in this app is public. Signed-out clients hold the publishable key,
-- so this is the backstop for any table whose RLS is ever mis-enabled.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
--> statement-breakpoint

-- Households are joined by code through join_home(), and created through
-- create_home(). See the comment on join_home for why this matters.
REVOKE INSERT, UPDATE ON public.home_member FROM authenticated;
--> statement-breakpoint
REVOKE INSERT ON public.home FROM authenticated;
--> statement-breakpoint

-- Profile rows are written by the signup trigger and removed by the auth.users
-- cascade; clients may only read and edit their own.
REVOKE INSERT, DELETE ON public."user" FROM authenticated;
--> statement-breakpoint

-- CREATE FUNCTION grants EXECUTE to PUBLIC by default, which would hand every
-- SECURITY DEFINER function above to `anon`. Revoked by name rather than with
-- `ALL FUNCTIONS IN SCHEMA public`: that blanket form would also strip
-- generate_home_code(), whose EXECUTE privilege *is* checked at INSERT time
-- because it backs a column default.
REVOKE ALL ON FUNCTION
  public.is_home_member(uuid),
  public.is_home_owner(uuid),
  public.user_created_home_count(),
  public.user_joined_home_count(),
  public.home_created_by_current_user(uuid),
  public.create_home(text),
  public.join_home(text),
  public.create_task(uuid, text, text, text)
FROM public;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION
  public.is_home_member(uuid),
  public.is_home_owner(uuid),
  public.user_created_home_count(),
  public.user_joined_home_count(),
  public.home_created_by_current_user(uuid),
  public.create_home(text),
  public.join_home(text),
  public.create_task(uuid, text, text, text)
TO authenticated;
--> statement-breakpoint

NOTIFY pgrst, 'reload schema';

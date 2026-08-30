CREATE UNIQUE INDEX "home_one_per_creator" ON "home" USING btree ("createdByUserId");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION user_created_home_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::integer FROM home WHERE "createdByUserId" = app_current_user_id();
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION user_joined_home_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::integer FROM home_member
  WHERE "userId" = app_current_user_id() AND "role" = 'member';
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION home_created_by_current_user(p_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM home WHERE id = p_id AND "createdByUserId" = app_current_user_id()
  );
$$;
--> statement-breakpoint
DROP POLICY home_insert ON "home";
--> statement-breakpoint
CREATE POLICY home_insert ON "home" FOR INSERT
  WITH CHECK (
    "createdByUserId" = app_current_user_id()
    AND user_created_home_count() = 0
  );
--> statement-breakpoint
DROP POLICY home_member_insert ON "home_member";
--> statement-breakpoint
CREATE POLICY home_member_insert ON "home_member" FOR INSERT
  WITH CHECK (
    "userId" = app_current_user_id()
    AND (
      ("role" = 'owner' AND home_created_by_current_user("homeId"))
      OR
      ("role" = 'member' AND user_joined_home_count() < 5)
    )
  );

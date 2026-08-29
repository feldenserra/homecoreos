CREATE TABLE "home_member" (
	"homeId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_member_homeId_userId_pk" PRIMARY KEY("homeId","userId")
);
--> statement-breakpoint
CREATE TABLE "home" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdByUserId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"homeId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"createdByUserId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "home_member" ADD CONSTRAINT "home_member_homeId_home_id_fk" FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_member" ADD CONSTRAINT "home_member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home" ADD CONSTRAINT "home_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_homeId_home_id_fk" FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_home_status_position_idx" ON "task" USING btree ("homeId","status","position");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text AS $$
  SELECT nullif(current_setting('app.user_id', true), '');
$$ LANGUAGE sql STABLE;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime LOGIN PASSWORD 'password';
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO app_runtime', current_database());
END
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO app_runtime;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION home_exists(p_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM home WHERE id = p_id);
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION home_exists(text) TO app_runtime;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_current_user_id() TO app_runtime;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
--> statement-breakpoint
ALTER TABLE "home" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "home_member" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "task" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY home_select ON "home" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "home"."id" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY home_insert ON "home" FOR INSERT
  WITH CHECK ("createdByUserId" = app_current_user_id());
--> statement-breakpoint
CREATE POLICY home_update ON "home" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "home"."id"
        AND m."userId" = app_current_user_id()
        AND m."role" = 'owner'
    )
  );
--> statement-breakpoint
CREATE POLICY home_member_select ON "home_member" FOR SELECT
  USING ("userId" = app_current_user_id());
--> statement-breakpoint
CREATE POLICY home_member_insert ON "home_member" FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());
--> statement-breakpoint
CREATE POLICY home_member_delete ON "home_member" FOR DELETE
  USING ("userId" = app_current_user_id());
--> statement-breakpoint
CREATE POLICY task_select ON "task" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "task"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY task_insert ON "task" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "task"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY task_update ON "task" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "task"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY task_delete ON "task" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "task"."homeId" AND m."userId" = app_current_user_id()
    )
  );
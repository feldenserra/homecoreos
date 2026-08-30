CREATE TABLE "user_ai_key" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"source" text NOT NULL,
	"url" text,
	"model" text,
	"accountId" text,
	"apiKey" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_ai_key" ADD CONSTRAINT "user_ai_key_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_ai_key_user_source_idx" ON "user_ai_key" USING btree ("userId","source");
--> statement-breakpoint
ALTER TABLE "user_ai_key" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_ai_key" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY user_ai_key_select ON "user_ai_key" FOR SELECT
  USING ("userId" = app_current_user_id());
--> statement-breakpoint
CREATE POLICY user_ai_key_insert ON "user_ai_key" FOR INSERT
  WITH CHECK ("userId" = app_current_user_id());
--> statement-breakpoint
CREATE POLICY user_ai_key_update ON "user_ai_key" FOR UPDATE
  USING ("userId" = app_current_user_id());
--> statement-breakpoint
CREATE POLICY user_ai_key_delete ON "user_ai_key" FOR DELETE
  USING ("userId" = app_current_user_id());

CREATE TABLE "chat_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"homeId" text NOT NULL,
	"title" text DEFAULT 'New chat' NOT NULL,
	"createdByUserId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"homeId" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_conversation" ADD CONSTRAINT "chat_conversation_homeId_home_id_fk" FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversation" ADD CONSTRAINT "chat_conversation_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_conversationId_chat_conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."chat_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_homeId_home_id_fk" FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_conversation_home_updated_idx" ON "chat_conversation" USING btree ("homeId","updatedAt");--> statement-breakpoint
CREATE INDEX "chat_message_conversation_created_idx" ON "chat_message" USING btree ("conversationId","createdAt");
--> statement-breakpoint
ALTER TABLE "chat_conversation" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "chat_conversation" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "chat_message" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "chat_message" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY chat_conversation_select ON "chat_conversation" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "chat_conversation"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY chat_conversation_insert ON "chat_conversation" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "chat_conversation"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY chat_conversation_update ON "chat_conversation" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "chat_conversation"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY chat_conversation_delete ON "chat_conversation" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "chat_conversation"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY chat_message_select ON "chat_message" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "chat_message"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY chat_message_insert ON "chat_message" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "chat_message"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY chat_message_update ON "chat_message" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "chat_message"."homeId" AND m."userId" = app_current_user_id()
    )
  );
--> statement-breakpoint
CREATE POLICY chat_message_delete ON "chat_message" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "home_member" m
      WHERE m."homeId" = "chat_message"."homeId" AND m."userId" = app_current_user_id()
    )
  );

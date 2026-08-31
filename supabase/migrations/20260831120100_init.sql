-- Table DDL. Mirrors src/db/schema.ts.
--
-- Re-generate with `yarn db:generate` after editing the Drizzle schema and diff
-- against this file; it is hand-maintained only because drizzle-kit does not
-- emit the auth.users foreign key (cross-schema) or the generate_home_code()
-- dependency ordering.

CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "home" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT public.generate_home_code() NOT NULL,
	"name" text NOT NULL,
	"createdByUserId" uuid DEFAULT auth.uid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_code_key" UNIQUE("code"),
	CONSTRAINT "home_one_per_creator" UNIQUE("createdByUserId"),
	CONSTRAINT "home_name_length_check" CHECK (char_length("name") BETWEEN 2 AND 64),
	CONSTRAINT "home_code_format_check" CHECK ("code" ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$')
);
--> statement-breakpoint
CREATE TABLE "home_member" (
	"homeId" uuid NOT NULL,
	"userId" uuid DEFAULT auth.uid() NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_member_homeId_userId_pk" PRIMARY KEY("homeId","userId"),
	CONSTRAINT "home_member_role_check" CHECK ("role" IN ('owner', 'member'))
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"homeId" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"createdByUserId" uuid DEFAULT auth.uid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "task_status_check" CHECK ("status" IN ('not_started', 'in_progress', 'stuck', 'complete')),
	CONSTRAINT "task_title_length_check" CHECK (char_length("title") BETWEEN 1 AND 200),
	CONSTRAINT "task_position_check" CHECK ("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "chat_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"homeId" uuid NOT NULL,
	"title" text DEFAULT 'New chat' NOT NULL,
	"systemPrompt" text,
	"aiSource" text,
	"aiModel" text,
	"aiUrl" text,
	"aiAccountId" text,
	"aiApiKey" text,
	"createdByUserId" uuid DEFAULT auth.uid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_conversation_id_home_key" UNIQUE("id","homeId"),
	CONSTRAINT "chat_conversation_ai_source_check" CHECK ("aiSource" IS NULL OR "aiSource" IN ('ollama', 'cloudflare')),
	CONSTRAINT "chat_conversation_ai_url_encrypted_check" CHECK ("aiUrl" IS NULL OR "aiUrl" LIKE 'enc:v1:%'),
	CONSTRAINT "chat_conversation_ai_api_key_encrypted_check" CHECK ("aiApiKey" IS NULL OR "aiApiKey" LIKE 'enc:v1:%')
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"homeId" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_message_role_check" CHECK ("role" IN ('user', 'assistant', 'system')),
	CONSTRAINT "chat_message_content_encrypted_check" CHECK ("content" LIKE 'enc:v1:%'),
	CONSTRAINT "chat_message_content_length_check" CHECK (char_length("content") <= 32000)
);
--> statement-breakpoint
CREATE TABLE "user_ai_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid DEFAULT auth.uid() NOT NULL,
	"source" text NOT NULL,
	"url" text,
	"model" text,
	"accountId" text,
	"apiKey" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_ai_key_source_check" CHECK ("source" IN ('ollama', 'cloudflare')),
	CONSTRAINT "user_ai_key_url_encrypted_check" CHECK ("url" IS NULL OR "url" LIKE 'enc:v1:%'),
	CONSTRAINT "user_ai_key_api_key_encrypted_check" CHECK ("apiKey" IS NULL OR "apiKey" LIKE 'enc:v1:%')
);
--> statement-breakpoint

-- The profile table is a strict extension of auth.users. Drizzle cannot express
-- this FK because it does not manage the auth schema.
ALTER TABLE "user" ADD CONSTRAINT "user_id_auth_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "home" ADD CONSTRAINT "home_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_member" ADD CONSTRAINT "home_member_homeId_home_id_fk" FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_member" ADD CONSTRAINT "home_member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_homeId_home_id_fk" FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversation" ADD CONSTRAINT "chat_conversation_homeId_home_id_fk" FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversation" ADD CONSTRAINT "chat_conversation_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- One composite FK replaces the separate conversationId and homeId FKs. Those
-- let a row point at a conversation in home B while claiming homeId = A: both
-- FKs were satisfied, and the RLS policy reads only homeId, so it passed.
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_conversation_home_fk" FOREIGN KEY ("conversationId","homeId") REFERENCES "public"."chat_conversation"("id","homeId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "user_ai_key" ADD CONSTRAINT "user_ai_key_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "task_home_status_position_idx" ON "task" USING btree ("homeId","status","position");--> statement-breakpoint
CREATE INDEX "chat_conversation_home_updated_idx" ON "chat_conversation" USING btree ("homeId","updatedAt");--> statement-breakpoint
CREATE INDEX "chat_message_conversation_created_idx" ON "chat_message" USING btree ("conversationId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "user_ai_key_user_source_idx" ON "user_ai_key" USING btree ("userId","source");

ALTER TABLE "user" ADD COLUMN "entitlementActive" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "entitlementExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "entitlementCheckedAt" timestamp;

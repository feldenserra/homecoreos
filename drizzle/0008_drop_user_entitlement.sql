ALTER TABLE "user" DROP COLUMN IF EXISTS "entitlementActive";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "entitlementExpiresAt";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "entitlementCheckedAt";

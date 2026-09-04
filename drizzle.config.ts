import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

/**
 * Drizzle is a schema-authoring tool here, not a runtime dependency and not the
 * thing that applies migrations.
 *
 * `yarn db:generate` writes SQL to ./drizzle for review; the file you actually
 * ship is the copy under supabase/migrations/. Apply with `yarn supabase:push`
 * (cloud) or `yarn supabase:commission` (self-host). Applying with drizzle-kit
 * would desync supabase_migrations.schema_migrations — that is why db:push is
 * blocked in package.json.
 *
 * dbCredentials.url is required by drizzle-kit's config shape; generate is
 * schema-file driven and does not need a live DB. For `yarn db:studio`, set
 * DATABASE_URL to the Supabase *direct* connection (not the pooler).
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
  },
  // Leave Supabase's own schemas (auth, storage, realtime, graphql, ...) alone.
  schemaFilter: ["public"],
  // Without this, drizzle-kit sees Supabase's anon/authenticated/service_role
  // roles as drift and offers to drop them.
  entities: {
    roles: {
      provider: "supabase",
    },
  },
});

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

/**
 * Drizzle is a schema-authoring tool here, not a runtime dependency and not the
 * thing that applies migrations.
 *
 * `yarn db:generate` writes SQL to ./drizzle for review; the file you actually
 * ship is the copy under supabase/migrations/, and `supabase db push` is the
 * only apply path. Applying with drizzle-kit instead would leave Supabase's
 * `supabase_migrations.schema_migrations` out of step with the real schema and
 * force a `supabase migration repair`. That is why db:push and db:migrate are
 * gone from package.json.
 *
 * Point DATABASE_URL_MIGRATE at the Supabase *direct* connection
 * (db.<project-ref>.supabase.co:5432), not the transaction pooler: pooled
 * connections cannot run DDL reliably.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_MIGRATE ?? process.env.DATABASE_URL!,
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

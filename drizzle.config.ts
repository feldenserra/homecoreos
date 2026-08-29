import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need a role that can CREATE ROLE / manage RLS (usually postgres).
    url: process.env.DATABASE_URL_MIGRATE ?? process.env.DATABASE_URL!,
  },
});

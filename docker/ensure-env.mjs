#!/usr/bin/env node
/**
 * Ensure root `.env` is the Docker Compose (self-host) file, then start the stack.
 *
 * - Missing `.env` → copy docker/.env.example
 * - Short CLI/cloud `.env` mistaken for compose → refuse with a clear message
 * - Otherwise → docker compose up --build -d
 */
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const composeExample = join(root, "docker", ".env.example");

function looksLikeShortAppEnv(contents) {
  const hasCliMigrate = /^\s*DATABASE_URL_MIGRATE=/m.test(contents);
  const hasCliUrl = /EXPO_PUBLIC_SUPABASE_URL=.*127\.0\.0\.1:54321/.test(
    contents,
  );
  const hasPostgresPassword = /^\s*POSTGRES_PASSWORD=/m.test(contents);
  const hasJwtSecret = /^\s*JWT_SECRET=/m.test(contents);
  return (hasCliMigrate || hasCliUrl) && !(hasPostgresPassword && hasJwtSecret);
}

if (!existsSync(composeExample)) {
  console.error(
    `Missing ${composeExample}. Cannot bootstrap Docker Compose env.`,
  );
  process.exit(1);
}

if (!existsSync(envPath)) {
  copyFileSync(composeExample, envPath);
  console.log("Created .env from docker/.env.example (self-host defaults).");
} else {
  const contents = readFileSync(envPath, "utf8");
  if (looksLikeShortAppEnv(contents)) {
    console.error(`
Your .env looks like the short CLI/cloud template (.env.example), not the
Docker Compose self-host file. Compose needs the full docker/.env.example.

Fix:
  cp docker/.env.example .env
  yarn compose:up

(Or remove .env and run yarn compose:up to recreate it.)
`);
    process.exit(1);
  }
}

const result = spawnSync(
  "docker",
  ["compose", "up", "--build", "-d"],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
);

process.exit(result.status === null ? 1 : result.status);

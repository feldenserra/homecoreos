#!/usr/bin/env node
/**
 * Official Supabase self-host helper (open-core).
 *
 *   yarn supabase:commission   # init (if needed) → up → migrate → print .env
 *   yarn supabase:selfhost:down
 *   yarn supabase:selfhost:logs
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const projectDir = join(__dirname, "supabase-project");
const migrationsDir = join(root, "supabase", "migrations");
const versionFile = join(__dirname, "SUPABASE_DOCKER_VERSION");
const overlayFile = join(__dirname, "docker-compose.homecore.yml");
const repoUrl = process.env.SUPABASE_REPO_URL ?? "https://github.com/supabase/supabase";

function die(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return result;
}

function readPin() {
  if (!existsSync(versionFile)) {
    die(`Missing ${versionFile}`);
  }
  return readFileSync(versionFile, "utf8").trim();
}

function projectReady() {
  return (
    existsSync(join(projectDir, "docker-compose.yml")) &&
    existsSync(join(projectDir, ".env"))
  );
}

function readProjectEnv() {
  const envPath = join(projectDir, ".env");
  if (!existsSync(envPath)) {
    die(`Missing ${envPath}. Run: yarn supabase:commission`);
  }
  const map = new Map();
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    map.set(line.slice(0, i), line.slice(i + 1));
  }
  return { envPath, map };
}

function setEnvKey(envPath, key, value) {
  let text = readFileSync(envPath, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) {
    text = text.replace(re, `${key}=${value}`);
  } else {
    text = `${text.trimEnd()}\n${key}=${value}\n`;
  }
  writeFileSync(envPath, text);
}

function ensureChatKey(envPath, map) {
  if (map.get("CHAT_CONTENT_ENCRYPTION_KEY")?.trim()) return;
  const key = randomBytes(32).toString("base64");
  setEnvKey(envPath, "CHAT_CONTENT_ENCRYPTION_KEY", key);
  map.set("CHAT_CONTENT_ENCRYPTION_KEY", key);
  console.log("Generated CHAT_CONTENT_ENCRYPTION_KEY in supabase-project/.env");
}

function syncOverlay() {
  if (!existsSync(overlayFile)) {
    die(`Missing HomeCore overlay ${overlayFile}`);
  }
  if (!existsSync(join(projectDir, "docker-compose.yml"))) {
    die(`No official project at ${projectDir}. Run: yarn supabase:commission`);
  }
  copyFileSync(overlayFile, join(projectDir, "docker-compose.homecore.yml"));
}

function composeArgs(extra) {
  syncOverlay();
  return [
    "compose",
    "--project-directory",
    projectDir,
    "--env-file",
    join(projectDir, ".env"),
    "-f",
    "docker-compose.yml",
    "-f",
    "docker-compose.homecore.yml",
    ...extra,
  ];
}

function compose(extra) {
  run("docker", composeArgs(extra), { cwd: projectDir });
}

/** Run SQL via psql inside the running db container. */
function psql(input) {
  const args = composeArgs([
    "exec",
    "-T",
    "db",
    "psql",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    "postgres",
    "-d",
    "postgres",
  ]);
  const result = spawnSync("docker", args, {
    cwd: projectDir,
    input,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    die((result.stderr || result.stdout || "psql failed").trim());
  }
  return (result.stdout ?? "").trim();
}

/** One-shot query; returns trimmed stdout (tuples only). */
function psqlScalar(query) {
  const args = composeArgs([
    "exec",
    "-T",
    "db",
    "psql",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-tAc",
    query,
  ]);
  const result = spawnSync("docker", args, {
    cwd: projectDir,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    die((result.stderr || result.stdout || "psql failed").trim());
  }
  return (result.stdout ?? "").trim();
}

function sparseClone(dest, ref) {
  mkdirSync(dest, { recursive: true });
  run("git", [
    "clone",
    "--filter=blob:none",
    "--no-checkout",
    "--depth=1",
    "--branch",
    ref,
    repoUrl,
    dest,
  ]);
  run("git", ["sparse-checkout", "init", "--cone"], { cwd: dest });
  run("git", ["sparse-checkout", "set", "docker"], { cwd: dest });
  run("git", ["checkout", "--quiet"], { cwd: dest });
}

function initFresh() {
  if (!existsSync(overlayFile)) {
    die(`Missing ${overlayFile}`);
  }

  const ref = readPin();
  console.log(`==> Sparse-cloning supabase docker/ @ ${ref}`);
  const tmp = join(
    tmpdir(),
    `homecore-supabase-${createHash("sha1").update(String(Date.now())).digest("hex").slice(0, 8)}`,
  );
  try {
    sparseClone(tmp, ref);
    const src = join(tmp, "docker");
    if (!existsSync(join(src, "docker-compose.yml"))) {
      die(`Clone succeeded but ${src}/docker-compose.yml is missing`);
    }
    mkdirSync(dirname(projectDir), { recursive: true });
    run("cp", ["-a", src, projectDir]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  const envExample = join(projectDir, ".env.example");
  const envPath = join(projectDir, ".env");
  if (existsSync(envExample) && !existsSync(envPath)) {
    copyFileSync(envExample, envPath);
  }
  if (!existsSync(envPath)) {
    die("Official docker tree has no .env.example to copy");
  }

  setEnvKey(envPath, "SUPABASE_PUBLIC_URL", "http://localhost:8000");
  setEnvKey(envPath, "API_EXTERNAL_URL", "http://localhost:8000/auth/v1");
  setEnvKey(envPath, "SITE_URL", "http://localhost:8081");
  // No mail container in this compose stack — autoconfirm so signup works.
  setEnvKey(envPath, "ENABLE_EMAIL_AUTOCONFIRM", "true");

  console.log("==> Generating secrets (generate-keys.sh)");
  run("sh", ["utils/generate-keys.sh", "--update-env"], { cwd: projectDir });
  console.log("==> Generating asymmetric auth keys (add-new-auth-keys.sh)");
  run("sh", ["utils/add-new-auth-keys.sh", "--update-env"], { cwd: projectDir });

  const { map } = readProjectEnv();
  ensureChatKey(envPath, map);
  syncOverlay();

  writeFileSync(
    join(projectDir, ".supabase-version"),
    [
      "# Supabase self-hosted version stamp (HomeCore init).",
      `ref=${ref}`,
      "",
    ].join("\n"),
  );

  console.log("==> Pulling images (may take a while)");
  const pull = spawnSync(
    "docker",
    [
      "compose",
      "--project-directory",
      projectDir,
      "--env-file",
      envPath,
      "-f",
      "docker-compose.yml",
      "pull",
    ],
    { cwd: projectDir, stdio: "inherit", shell: process.platform === "win32" },
  );
  if (pull.status !== 0) {
    console.warn(
      "WARNING: docker compose pull failed; continuing — up will retry pulls.",
    );
  }
}

function ensureInit() {
  if (projectReady()) {
    console.log("==> Self-host project already present");
    return;
  }
  initFresh();
}

function up() {
  const { envPath, map } = readProjectEnv();
  ensureChatKey(envPath, map);
  console.log("==> Starting official Supabase + HomeCore overlay");
  compose(["up", "-d", "--wait"]);
}

function down() {
  if (!projectReady()) {
    die(`No project at ${projectDir}`);
  }
  compose(["down"]);
}

function logs(service) {
  if (!projectReady()) {
    die(`No project at ${projectDir}`);
  }
  compose(service ? ["logs", "-f", service] : ["logs", "-f"]);
}

function applyMigrations() {
  if (!existsSync(migrationsDir)) {
    die(`Missing ${migrationsDir}`);
  }

  console.log("==> Applying HomeCore migrations");
  psql(`
CREATE TABLE IF NOT EXISTS public._homecore_schema_applied (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
`);

  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No SQL files under supabase/migrations/");
    return;
  }

  for (const name of files) {
    const safe = name.replace(/'/g, "''");
    const already = psqlScalar(
      `SELECT 1 FROM public._homecore_schema_applied WHERE filename = '${safe}'`,
    );
    if (already === "1") {
      console.log(`Skip ${name} (already applied)`);
      continue;
    }
    console.log(`Apply ${name}...`);
    psql(readFileSync(join(migrationsDir, name)));
    psql(
      `INSERT INTO public._homecore_schema_applied (filename) VALUES ('${safe}')`,
    );
  }
  console.log("HomeCore schema SQL applied.");
}

function printAppEnv() {
  const { map } = readProjectEnv();
  const url = map.get("SUPABASE_PUBLIC_URL") || "http://localhost:8000";
  const anon =
    map.get("ANON_KEY") || map.get("SUPABASE_PUBLISHABLE_KEY") || "";
  console.log("");
  console.log("Paste into repo-root .env for the app:");
  console.log("---");
  console.log(`EXPO_PUBLIC_SUPABASE_URL=${url}`);
  console.log(`EXPO_PUBLIC_SUPABASE_ANON_KEY=${anon}`);
  console.log("EXPO_PUBLIC_IS_LOCAL=true");
  console.log("---");
  console.log(
    "(CHAT_CONTENT_ENCRYPTION_KEY stays in docker/supabase-project/.env — not in the app binary.)",
  );
}

function commission() {
  ensureInit();
  // Existing installs: ensure autoconfirm without requiring re-init.
  const { envPath } = readProjectEnv();
  setEnvKey(envPath, "ENABLE_EMAIL_AUTOCONFIRM", "true");
  up();
  applyMigrations();
  console.log("==> Restarting auth so ENABLE_EMAIL_AUTOCONFIRM is live");
  compose(["up", "-d", "--force-recreate", "auth"]);
  console.log("==> Restarting functions so mounts/secrets are current");
  compose(["up", "-d", "--force-recreate", "functions"]);
  printAppEnv();
  console.log("");
  console.log("Then: yarn start");
}

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "commission":
    commission();
    break;
  case "down":
    down();
    break;
  case "logs":
    logs(rest[0]);
    break;
  case "env":
    printAppEnv();
    break;
  case "init":
    if (projectReady()) {
      die(`${projectDir} already exists. Use: yarn supabase:commission`);
    }
    initFresh();
    console.log("\nNext: yarn supabase:commission");
    break;
  case "up":
    up();
    break;
  default:
    console.log(
      "Usage: node docker/selfhost.mjs <commission|down|logs|env>",
    );
    process.exit(cmd ? 1 : 0);
}

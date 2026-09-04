#!/usr/bin/env node
/**
 * Thin wrapper around official Supabase self-host Docker.
 *
 *   node docker/selfhost.mjs init        # sparse-clone pinned docker/ + generate secrets
 *   node docker/selfhost.mjs up          # start official stack + HomeCore overlay
 *   node docker/selfhost.mjs down
 *   node docker/selfhost.mjs logs [svc]
 *   node docker/selfhost.mjs commission  # apply migrations + print app .env snippet
 *   node docker/selfhost.mjs env         # print URL + anon key for root .env
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
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

function readProjectEnv() {
  const envPath = join(projectDir, ".env");
  if (!existsSync(envPath)) {
    die(`Missing ${envPath}. Run: yarn supabase:selfhost:init`);
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
    die(`No official project at ${projectDir}. Run: yarn supabase:selfhost:init`);
  }
  // Compose resolves relative volume paths against the project directory
  // (first -f file), so the overlay must live next to docker-compose.yml.
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

function init() {
  if (existsSync(projectDir)) {
    die(
      `${projectDir} already exists.\n` +
        `Remove it to re-init, or run: yarn supabase:selfhost:up`,
    );
  }
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

  // Localhost defaults for a clone-and-run self-host.
  setEnvKey(envPath, "SUPABASE_PUBLIC_URL", "http://localhost:8000");
  setEnvKey(envPath, "API_EXTERNAL_URL", "http://localhost:8000/auth/v1");
  setEnvKey(envPath, "SITE_URL", "http://localhost:8081");

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

  console.log(`==> Pulling images (may take a while)`);
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
      "WARNING: docker compose pull failed; retry later with: yarn supabase:selfhost:up",
    );
  }

  console.log("");
  console.log(`Self-host project ready at ${projectDir}`);
  console.log("Next:");
  console.log("  yarn supabase:selfhost:up");
  console.log("  yarn supabase:commission");
  console.log("  # paste printed keys into root .env, then: yarn start");
}

function up() {
  const { envPath, map } = readProjectEnv();
  ensureChatKey(envPath, map);
  console.log("==> Starting official Supabase + HomeCore overlay");
  compose(["up", "-d", "--wait"]);
  console.log("");
  console.log("Stack is up. Apply schema (if needed) and print app keys:");
  console.log("  yarn supabase:commission");
}

function down() {
  compose(["down"]);
}

function logs(service) {
  compose(service ? ["logs", "-f", service] : ["logs", "-f"]);
}

function printAppEnv() {
  const { map } = readProjectEnv();
  const url = map.get("SUPABASE_PUBLIC_URL") || "http://localhost:8000";
  const anon =
    map.get("ANON_KEY") ||
    map.get("SUPABASE_PUBLISHABLE_KEY") ||
    "";
  console.log("");
  console.log("Paste into repo-root .env for the app:");
  console.log("---");
  console.log(`EXPO_PUBLIC_SUPABASE_URL=${url}`);
  console.log(`EXPO_PUBLIC_SUPABASE_ANON_KEY=${anon}`);
  console.log("---");
  console.log(
    "(Edge secret CHAT_CONTENT_ENCRYPTION_KEY stays in docker/supabase-project/.env — do not put it in the app binary.)",
  );
}

function commission() {
  const { envPath, map } = readProjectEnv();
  ensureChatKey(envPath, map);

  console.log("==> Applying HomeCore migrations (apply-schema)");
  // One-shot service: recreate so it runs even if a prior exit remains.
  compose(["run", "--rm", "apply-schema"]);

  console.log("==> Restarting functions so mounts/secrets are current");
  compose(["up", "-d", "--force-recreate", "functions"]);

  printAppEnv();
  console.log("");
  console.log("Then: yarn start");
}

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "init":
    init();
    break;
  case "up":
    up();
    break;
  case "down":
    down();
    break;
  case "logs":
    logs(rest[0]);
    break;
  case "commission":
    commission();
    break;
  case "env":
    printAppEnv();
    break;
  default:
    console.log(`Usage: node docker/selfhost.mjs <init|up|down|logs|commission|env>`);
    process.exit(cmd ? 1 : 0);
}

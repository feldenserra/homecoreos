# HomeCore

A shared space for a household: a kanban board for chores and an AI chat that
belongs to the house rather than to one person's notes app. Create a home, hand
out a 12-character code, and everyone who lives there sees the same board.

Cross-platform Expo (iOS, Android, web) on Supabase.

## Architecture

| Concern | Where it lives |
|---|---|
| Screens and navigation | `app/` — Expo Router, file-based |
| Shared components | `components/` — react-native-paper + StyleSheet |
| Data access | `lib/api/` |
| Auth | `lib/auth-context.tsx` over `supabase.auth` |
| Schema authoring | `src/db/schema.ts` (Drizzle) |
| Applied SQL | `supabase/migrations/` |
| Server-only logic | `supabase/functions/` (Deno Edge Functions) |

**Authorization is row-level security, not application code.** Every policy is
keyed on `(select auth.uid())`, so the client's JWT is the only identity in play.
There is no server tier to trust and nothing passes a user id as an argument.

Three things cannot be direct client queries, and each is an Edge Function:

- `chat` — streams from Ollama or Cloudflare Workers AI. Holds the content
  encryption key and the user's decrypted provider credentials.
- `conversations` — chat reads. Titles, prompts and message bodies are encrypted
  at rest, so only the function can read them.
- `ai-keys` — provider credential CRUD. Never returns a stored API key.

Two more are Postgres functions, because they are multi-statement and must be
atomic — and because `home_member` INSERT is revoked from `authenticated`, which
is what keeps the join code the only way into a household:

- `create_home(p_name)` — quota, code generation with collision retry, and the
  owner membership row.
- `join_home(p_code)` — code lookup and the five-join cap.

## Ways to run

| Mode | Who | Command | API URL |
|---|---|---|---|
| **Self-host (open-core)** | Anyone cloning the repo | `yarn compose:up` | `http://localhost:8000` |
| **Cloud SaaS** | You hosting for customers | Hosted Supabase + deploy web/functions | `https://<ref>.supabase.co` |
| **CLI local / native** | App developers | `yarn supabase:start` | `http://127.0.0.1:54321` |

Do not run the open-core compose stack and `yarn supabase:start` at the same time
(overlapping Docker resources). App code is unchanged between modes — only env
values (and hosted secrets) change.

## Setup

```bash
yarn install
```

### 1. Self-host (open-core) — Docker Compose

Requires Docker Desktop (or another Compose v2 runtime). First start pulls a
full Supabase image set; **8 GB RAM** is recommended.

The root [`docker-compose.yml`](docker-compose.yml) includes a pinned official
Supabase self-host tree under [`docker/supabase/`](docker/supabase/) (see
`docker/supabase/VERSION`), serves edge functions from
[`supabase/functions/`](supabase/functions/), and builds the Expo web app into
nginx. After Postgres is healthy, the one-shot `apply-schema` service runs
`psql` on the SQL files in [`supabase/migrations/`](supabase/migrations/) so a
fresh stack gets the HomeCore schema; this is not `yarn supabase:push` and not
Drizzle apply.

```bash
yarn install          # once (provides yarn compose:up helper)
yarn compose:up       # copies docker/.env.example → .env if needed, then starts
```

Do **not** use the short root [`.env.example`](.env.example) for compose — that
file is for CLI/cloud only. Compose needs [`docker/.env.example`](docker/.env.example)
(the long Supabase self-host defaults). `yarn compose:up` refuses a mistaken
short `.env` instead of starting a broken stack.

Equivalent manual steps: `cp docker/.env.example .env && docker compose up --build`.

Then open **http://localhost:3000**. The web image is built with
`EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000` and the matching anon key from
`.env`, so the browser talks to the API gateway on the host.

Useful: `yarn compose:logs`, `yarn compose:down`.

Change every secret in `.env` before exposing the stack beyond localhost.

### 2. Cloud SaaS (you host for paying users)

```bash
cp .env.example .env
# Set:
#   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
#   DATABASE_URL_MIGRATE=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
# Use the direct DB URL, not the transaction pooler.

supabase link --project-ref <project-ref>
yarn supabase:push

supabase secrets set CHAT_CONTENT_ENCRYPTION_KEY="$(openssl rand -base64 32)"
yarn supabase:deploy
yarn start   # or deploy the web export to your host of choice
```

Never give edge secrets an `EXPO_PUBLIC_` prefix. If `CHAT_CONTENT_ENCRYPTION_KEY`
is lost, encrypted columns are unreadable — back it up.

Configure GitHub under Auth → Providers. Callback:
`https://<project-ref>.supabase.co/auth/v1/callback`.

Register under Auth → URL Configuration:

```
homecoreos://auth/callback
homecoreos://**
http://localhost:8081/**
```

### 3. CLI local (native / Expo iteration)

```bash
cp .env.example .env
yarn supabase:start           # prints URL + anon key → paste into .env
openssl rand -base64 32       # → CHAT_CONTENT_ENCRYPTION_KEY in .env
yarn supabase:push
yarn types:generate

yarn supabase:functions       # --env-file .env
yarn start
```

`yarn supabase:push` is the only migration apply path for the CLI stack.
`drizzle-kit` authors schema (`yarn db:generate`); applying with it desyncs
`supabase_migrations.schema_migrations`. `yarn db:push` fails on purpose.

**Device URL notes** (CLI stack on `:54321`):

| Client | `EXPO_PUBLIC_SUPABASE_URL` |
|---|---|
| Web / iOS Simulator | `http://127.0.0.1:54321` |
| Android emulator | `http://10.0.2.2:54321` |
| Physical device | `http://<your-LAN-IP>:54321` |

**Use a development build, not Expo Go, for anything touching auth.** In Expo Go
`makeRedirectUri` produces `exp://192.168.x.x:8081/...`, which cannot be
registered as a stable Supabase redirect URL per developer.

GitHub OAuth against the CLI stack: set `SUPABASE_AUTH_GITHUB_CLIENT_ID` /
`SUPABASE_AUTH_GITHUB_SECRET` in `.env`. Callback:
`http://127.0.0.1:54321/auth/v1/callback`.

## Checks

```bash
yarn typecheck
yarn lint
yarn test
deno check supabase/functions/*/index.ts
```

`yarn test` covers the pure logic in `lib/` (`ts-jest`). The Edge Functions are
Deno and are excluded from both the root `tsconfig.json` and Jest.

## Notes for whoever works on this next

- **Constraint names are part of the UI contract.** Validation that used to live
  in server actions is now named CHECK constraints, and PostgREST reports a
  23514 with only the constraint name. `lib/api/errors.ts` maps them to
  messages; renaming one without updating that map silently degrades the error.
- **Read `supabase/migrations/*_rls.sql` before changing a policy.** The comments
  there record why several non-obvious choices are what they are — why
  `join_home` re-implements its own quota check, why `FORCE ROW LEVEL SECURITY`
  was dropped, and why widening `home_member_select` needs a SECURITY DEFINER
  helper rather than an inline `EXISTS`.
- **A LAN Ollama no longer works.** An Edge Function cannot route to anyone's
  local network; private ranges are refused as an SSRF guard. Public hosts and
  tunnels are fine.
- **There is no offline write queue.** `supabase-js` does not retry, so a failed
  mutation surfaces its error and the caller re-reads.
- **Dark mode is deliberately absent**, matching the forced light scheme.
- **Upgrading the vendored Supabase Docker tree:** replace `docker/supabase/`
  from a newer `self-hosted/v*` tag and bump `docker/supabase/VERSION`. Keep the
  HomeCore `importMapPath` tweak in `volumes/functions/main/index.ts`.

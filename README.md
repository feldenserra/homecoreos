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

Edge Functions (not direct client queries): `chat`, `conversations`, `ai-keys`.

Postgres RPCs: `create_home(p_name)`, `join_home(p_code)`.

The app and the backend are separate: **commission Supabase once**, then run the
app against it.

## Run the app

```bash
yarn install
cp .env.example .env
# set EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY from your instance
yarn start
```

That is the whole app path. No Docker Compose is required to start Expo.

## Commission Supabase

Pick one backend. Do not run the Supabase CLI stack and self-host Docker at the
same time.

### Cloud

```bash
cp .env.example .env
# EXPO_PUBLIC_* → project URL + anon key
# DATABASE_URL_MIGRATE → direct DB URL (not the pooler), for drizzle only

supabase link --project-ref <project-ref>
yarn supabase:push
supabase secrets set CHAT_CONTENT_ENCRYPTION_KEY="$(openssl rand -base64 32)"
yarn supabase:deploy
yarn start
```

Auth → URL Configuration should include:

```
homecoreos://auth/callback
homecoreos://**
http://localhost:8081/**
```

### Local CLI (day-to-day development)

```bash
cp .env.example .env
yarn supabase:start           # paste anon key into .env
openssl rand -base64 32       # → CHAT_CONTENT_ENCRYPTION_KEY in .env
yarn supabase:push
yarn supabase:functions       # other terminal
yarn start
```

| Client | `EXPO_PUBLIC_SUPABASE_URL` |
|---|---|
| Web / iOS Simulator | `http://127.0.0.1:54321` |
| Android emulator | `http://10.0.2.2:54321` |
| Physical device | `http://<LAN-IP>:54321` |

Use a **development build**, not Expo Go, for auth redirects.

### Self-host (open-core)

Uses the [official Supabase Docker](https://supabase.com/docs/guides/self-hosting/docker)
tree (pinned in `docker/SUPABASE_DOCKER_VERSION`), not a vendored copy in git.
HomeCore only adds migrations + Edge Function mounts.

```bash
yarn supabase:selfhost:init   # once — clones official docker/, generates secrets
yarn supabase:selfhost:up
yarn supabase:commission      # apply migrations, print keys for root .env
# paste EXPO_PUBLIC_* into .env
yarn start
```

Useful: `yarn supabase:selfhost:logs`, `yarn supabase:selfhost:down`.

Generated project lives in `docker/supabase-project/` (gitignored). Change
secrets there before exposing the stack beyond localhost.

Optional static web image: [`Dockerfile`](Dockerfile) — build separately with
your commissioned `EXPO_PUBLIC_*` values; it is not part of self-host up.

## Schema workflow

- Author in Drizzle: `yarn db:generate`
- Ship SQL under `supabase/migrations/`
- Apply with `yarn supabase:push` (CLI/cloud) or `yarn supabase:commission` (self-host)
- Do not use `yarn db:push` — it desyncs Supabase migration history on purpose

## Checks

```bash
yarn typecheck
yarn lint
yarn test
deno check supabase/functions/*/index.ts
```

## Notes for whoever works on this next

- **Constraint names are part of the UI contract.** `lib/api/errors.ts` maps
  Postgres CHECK names to messages; renaming one without updating that map
  silently degrades the error.
- **Read `supabase/migrations/*_rls.sql` before changing a policy.**
- **A LAN Ollama no longer works** from Edge Functions (SSRF guard). Public
  hosts and tunnels are fine.
- **No offline write queue.** Failed mutations surface errors; callers re-read.
- **Dark mode is deliberately absent.**
- **Self-host pin:** bump `docker/SUPABASE_DOCKER_VERSION`, remove
  `docker/supabase-project/`, re-run `yarn supabase:selfhost:init`. Keep the
  HomeCore `importMapPath` in `docker/volumes/functions/main/index.ts`.

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
keyed on `(select auth.uid())`.

Edge Functions: `chat`, `conversations`, `ai-keys`.
Postgres RPCs: `create_home(p_name)`, `join_home(p_code)`.

The app only needs a Supabase URL + anon key. Server secrets (especially
`CHAT_CONTENT_ENCRYPTION_KEY`) never go in the app `.env`.

## Run the app

```bash
yarn install
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY from your backend
yarn start
```

## Self-host (open-core)

Uses [official Supabase Docker](https://supabase.com/docs/guides/self-hosting/docker)
(pinned in `docker/SUPABASE_DOCKER_VERSION`).

```bash
yarn install
yarn supabase:commission   # init if needed → start → migrate → print keys
# paste EXPO_PUBLIC_* into .env
yarn start
```

**Encryption key:** generated into `docker/supabase-project/.env` and passed to
Edge Functions. Do not copy it into the app `.env`. Back it up before you wipe
the project dir.

Re-run `yarn supabase:commission` to apply new migration files.
Stop / logs: `yarn supabase:selfhost:down`, `yarn supabase:selfhost:logs`.

## Cloud: develop against a dev project

One-time:

```bash
cp .env.example .env
# Dashboard → Project URL + anon key → EXPO_PUBLIC_*

supabase link --project-ref <dev-ref>
supabase secrets set CHAT_CONTENT_ENCRYPTION_KEY="$(openssl rand -base64 32)"
# Back that key up — losing it makes encrypted chat/credentials unreadable.
yarn supabase:ship
yarn start
```

Day-to-day loop (linked to **dev**):

```text
edit app / schema / functions
  → yarn db:generate (if schema) → review SQL → land under supabase/migrations/
  → yarn supabase:ship    # migrations + Edge Functions → linked project
  → yarn start
```

Or separately: `yarn supabase:push` (SQL only), `yarn supabase:deploy` (functions).

Auth → URL Configuration:

```
homecoreos://auth/callback
homecoreos://**
http://localhost:8081/**
```

## Cloud: ship to prod

Prod is a second Supabase project. Set its encryption secret **once** (do not
rotate casually). Then push the same migrations/functions:

```bash
supabase link --project-ref <prod-ref>
# Confirm CHAT_CONTENT_ENCRYPTION_KEY is already set on prod
yarn supabase:ship
```

Build/host the app with **prod** `EXPO_PUBLIC_*` (EAS, CI, or your web host).
Keep local `.env` on the **dev** project for daily work; re-link when you ship,
or run prod `ship` from CI with a prod access token.

## Schema workflow

- Author: `yarn db:generate` → ship SQL under `supabase/migrations/`
- Cloud: `yarn supabase:push` or `yarn supabase:ship`
- Self-host: `yarn supabase:commission`
- Do not use `yarn db:push` (desyncs Supabase migration history on purpose)

## Checks

```bash
yarn typecheck
yarn lint
yarn test
deno check supabase/functions/*/index.ts
```

## Notes for whoever works on this next

- **Constraint names are part of the UI contract.** `lib/api/errors.ts` maps
  Postgres CHECK names to messages.
- **Read `supabase/migrations/*_rls.sql` before changing a policy.**
- **A LAN Ollama no longer works** from Edge Functions (SSRF guard).
- **No offline write queue.**
- **Dark mode is deliberately absent.**
- **Self-host pin:** bump `docker/SUPABASE_DOCKER_VERSION`, remove
  `docker/supabase-project/`, re-run `yarn supabase:commission`. Keep the
  HomeCore `importMapPath` in `docker/volumes/functions/main/index.ts`.

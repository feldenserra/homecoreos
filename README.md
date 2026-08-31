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

## Setup

```bash
yarn install
cp .env.example .env          # then fill in the values
```

### Database

```bash
supabase start                # local stack
supabase db push              # applies supabase/migrations/ in order
yarn types:generate           # regenerates lib/database.types.ts
```

`supabase db push` is the only way migrations are applied. `drizzle-kit` is for
authoring the schema and diffing it (`yarn db:generate`); applying with it
directly would leave `supabase_migrations.schema_migrations` out of step with the
real schema and force a `supabase migration repair`. `yarn db:push` is
deliberately wired to fail and say so.

Point `DATABASE_URL_MIGRATE` at the Supabase **direct** connection
(`db.<project-ref>.supabase.co:5432`), not the transaction pooler — pooled
connections cannot run DDL reliably.

### Edge Function secrets

```bash
supabase secrets set CHAT_CONTENT_ENCRYPTION_KEY="$(openssl rand -base64 32)"
```

Never give any of these an `EXPO_PUBLIC_` prefix; that ships them in the app
bundle. Only the Supabase URL and the publishable key belong there, and both are
public by design.

If this key is lost, every encrypted column becomes unreadable. Back it up.

### Running

```bash
supabase functions serve      # in one terminal
yarn start                    # in another
```

**Use a development build, not Expo Go, for anything touching auth.** In Expo Go
`makeRedirectUri` produces `exp://192.168.x.x:8081/...`, which cannot be
registered as a stable Supabase redirect URL per developer.

Register under Supabase → Auth → URL Configuration:

```
homecoreos://auth/callback
homecoreos://**
http://localhost:8081/**
```

The GitHub OAuth app's own callback is only
`https://<project-ref>.supabase.co/auth/v1/callback`.

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
- **A LAN Ollama no longer works.** The old deployment ran with Docker host
  networking; an Edge Function cannot route to anyone's local network, and
  private ranges are refused outright as an SSRF guard. Publicly reachable hosts
  and tunnels are fine.
- **There is no offline write queue.** `supabase-js` does not retry, so a failed
  mutation surfaces its error and the caller re-reads. This matches the web app,
  which had no client cache at all.
- **Dark mode is deliberately absent**, matching the web app's forced light
  scheme. Adding it is a design decision, not a port.

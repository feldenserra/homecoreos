-- Objects the table DDL itself depends on, so they must land before it.
--
-- Everything else (policies, triggers, grants) lives in the _rls migration.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
--> statement-breakpoint

-- Generates the 12-character household join code.
--
-- Replaces generateHomeId() from lib/home-id.ts, which used node:crypto and so
-- cannot run in React Native. The charset omits 0/O and 1/I/L so a code can be
-- read aloud or off a screen without ambiguity.
--
-- 256 % 32 = 0, so a uniform byte modulo 32 is itself uniform — no modulo bias
-- to reject-sample around. 32^12 is about 1.15e18.
--
-- search_path deliberately lists both candidate schemas instead of being empty:
-- pgcrypto lives in `extensions` on Supabase but in `public` elsewhere, and
-- hardcoding either one makes this function fail on the other. A mutable
-- search_path is only a privilege-escalation concern for SECURITY DEFINER
-- functions; this one is SECURITY INVOKER and touches no tables.
--
-- Callers must still handle collisions: a column DEFAULT is evaluated once, as
-- the tuple is formed and before any index is touched, so it cannot retry.
-- create_home() owns the retry loop.
CREATE OR REPLACE FUNCTION public.generate_home_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = extensions, public, pg_catalog
AS $$
DECLARE
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  bytes bytea;
  code text := '';
BEGIN
  bytes := gen_random_bytes(12);
  FOR i IN 0..11 LOOP
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  END LOOP;
  RETURN code;
END;
$$;

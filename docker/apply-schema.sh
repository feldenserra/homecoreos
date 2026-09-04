#!/usr/bin/env bash
# Load HomeCore schema SQL from supabase/migrations/ onto self-host Postgres.
# Used by the apply-schema one-shot in docker-compose.homecore.yml.
# Not Drizzle apply and not supabase db push — just psql of those files.
set -euo pipefail

PGHOST=db
PGPORT=5432
PGUSER=postgres
PGDATABASE=postgres

echo "Waiting for Postgres at ${PGHOST}:${PGPORT}..."
until pg_isready -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" >/dev/null 2>&1; do
  sleep 1
done

psql -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS public._homecore_schema_applied (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL

shopt -s nullglob
files=(/migrations/*.sql)
if [ ${#files[@]} -eq 0 ]; then
  echo "No SQL files found under /migrations"
  exit 0
fi

IFS=$'\n' sorted=($(printf '%s\n' "${files[@]}" | sort))
unset IFS

for file in "${sorted[@]}"; do
  name="$(basename "$file")"
  already="$(psql -tAc "SELECT 1 FROM public._homecore_schema_applied WHERE filename = '${name}'")"
  if [ "${already}" = "1" ]; then
    echo "Skip ${name} (already applied)"
    continue
  fi
  echo "Apply ${name}..."
  psql -v ON_ERROR_STOP=1 -f "$file"
  psql -v ON_ERROR_STOP=1 -c "INSERT INTO public._homecore_schema_applied (filename) VALUES ('${name}')"
done

echo "HomeCore schema SQL applied."

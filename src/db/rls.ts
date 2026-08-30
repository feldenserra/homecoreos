import { sql } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "./index";
import * as schema from "./schema";

type Schema = typeof schema;

export type RlsTx = PgTransaction<
  PostgresJsQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;

/**
 * Run queries in a transaction with RLS context set to the given user id.
 * Must be used for all home / membership / task access (RLS enforced).
 */
export async function withRls<T>(
  userId: string,
  fn: (tx: RlsTx) => Promise<T>,
): Promise<T> {
  if (!userId) {
    throw new Error("withRls requires a userId");
  }

  return db.transaction(async (tx) => {
    // SET LOCAL does not support parameterized values; escape single quotes.
    const safe = userId.replace(/'/g, "''");
    await tx.execute(sql.raw(`SET LOCAL app.user_id = '${safe}'`));
    return fn(tx);
  });
}

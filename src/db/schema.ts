/**
 * Drizzle schema — the authoring source of truth for DDL.
 *
 * This module is a *build-time* artifact only. React Native never imports it:
 * the app talks to Supabase over PostgREST and gets its row types from
 * `supabase gen types typescript`. Drizzle exists here so schema changes stay
 * reviewable as TypeScript, and `drizzle-kit generate` emits the SQL that is
 * then applied through the Supabase CLI.
 *
 * Two conventions carried over from the pre-Supabase schema, deliberately:
 *   - The household is called `home`, and columns are quoted camelCase
 *     (`"homeId"`, `"userId"`, `"createdByUserId"`). Renaming them would mean
 *     rewriting all 22 RLS policies and every query for no functional gain.
 *   - Enums are `text` + CHECK rather than Postgres enum types, so adding a
 *     value stays a one-line migration.
 *
 * Because clients now write directly to these tables under RLS, validation
 * that used to live in server actions lives here as named CHECK constraints —
 * the names are load-bearing, since PostgREST surfaces only the constraint
 * name to the UI on a 23514.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  AiKeySource,
  ChatMessageRole,
  HomeMemberRole,
  MealType,
  TaskStatus,
} from "../../lib/types";

export type {
  AiKeySource,
  ChatMessageRole,
  HomeMemberRole,
  MealType,
  TaskStatus,
} from "../../lib/types";
export {
  AI_KEY_SOURCES,
  CHAT_MESSAGE_ROLES,
  HOME_MEMBER_ROLES,
  MEAL_TYPES,
  TASK_STATUSES,
} from "../../lib/types";

/**
 * Profile mirror of `auth.users`. Rows are created by the
 * `handle_new_auth_user` trigger — never by a client.
 *
 * `id` also carries `REFERENCES auth.users(id) ON DELETE CASCADE`, added in the
 * RLS migration: Drizzle cannot express a cross-schema FK into a schema it does
 * not manage.
 *
 * `email` is intentionally nullable and NOT unique. GitHub accounts with a
 * private email arrive with a null email, and one person signing up via both
 * GitHub and email produces two `auth.users` rows. Either case would raise
 * inside the trigger, and a raise there rolls back the `auth.users` insert —
 * signup fails with "500 Database error saving new user".
 */
export const users = pgTable("user", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  image: text("image"),
});

export const homes = pgTable(
  "home",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * The human-typeable join code, and the only capability that grants access
     * to a household. Direct INSERT on `home_member` is revoked precisely so
     * that knowing this code is the sole way in — see the RLS migration.
     */
    code: text("code")
      .notNull()
      .default(sql`public.generate_home_code()`),
    name: text("name").notNull(),
    createdByUserId: uuid("createdByUserId")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("home_code_key").on(table.code),
    /**
     * A named UNIQUE constraint rather than a bare unique index: `create_home`
     * retries on `unique_violation` for code collisions and must be able to
     * tell that apart from "you already created a home" by constraint name.
     */
    unique("home_one_per_creator").on(table.createdByUserId),
    check(
      "home_name_length_check",
      sql`char_length(${table.name}) between 2 and 64`,
    ),
    check(
      "home_code_format_check",
      sql`${table.code} ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$'`,
    ),
  ],
);

export const homeMembers = pgTable(
  "home_member",
  {
    homeId: uuid("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<HomeMemberRole>().notNull().default("member"),
    joinedAt: timestamp("joinedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.homeId, table.userId] }),
    check("home_member_role_check", sql`${table.role} in ('owner', 'member')`),
  ],
);

export const tasks = pgTable(
  "task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").$type<TaskStatus>().notNull().default("not_started"),
    position: integer("position").notNull().default(0),
    createdByUserId: uuid("createdByUserId")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => users.id, { onDelete: "cascade" }),
    /**
     * Optional housemate. The composite FK below is what actually requires
     * membership — this one is so PostgREST can embed `user(...)`.
     */
    assignedToUserId: uuid("assignedToUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("task_home_status_position_idx").on(
      table.homeId,
      table.status,
      table.position,
    ),
    /**
     * MATCH SIMPLE: a null assignee skips the check. Leaving the house
     * (`home_member` row deleted) clears the assignment.
     */
    foreignKey({
      name: "task_assignee_home_member_fk",
      columns: [table.homeId, table.assignedToUserId],
      foreignColumns: [homeMembers.homeId, homeMembers.userId],
    }).onDelete("set null"),
    check(
      "task_status_check",
      sql`${table.status} in ('not_started', 'in_progress', 'stuck', 'complete')`,
    ),
    // Mirrors the 1..200 bound previously enforced in createTask.
    check(
      "task_title_length_check",
      sql`char_length(${table.title}) between 1 and 200`,
    ),
    check("task_position_check", sql`${table.position} >= 0`),
  ],
);

export const chatConversations = pgTable(
  "chat_conversation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    /**
     * Encrypted once the first message names the chat. The literal default is
     * plaintext, and `decryptChatText` passes non-prefixed values through, so
     * there is deliberately no ciphertext CHECK on this column.
     */
    title: text("title").notNull().default("New chat"),
    systemPrompt: text("systemPrompt"),
    aiSource: text("aiSource").$type<AiKeySource>(),
    aiModel: text("aiModel"),
    /** Encrypted. Not readable by clients — see the column-level GRANT. */
    aiUrl: text("aiUrl"),
    aiAccountId: text("aiAccountId"),
    /** Encrypted. Not readable by clients — see the column-level GRANT. */
    aiApiKey: text("aiApiKey"),
    createdByUserId: uuid("createdByUserId")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("chat_conversation_home_updated_idx").on(
      table.homeId,
      table.updatedAt,
    ),
    /** Target for chat_message's composite FK. */
    unique("chat_conversation_id_home_key").on(table.id, table.homeId),
    check(
      "chat_conversation_ai_source_check",
      sql`${table.aiSource} is null or ${table.aiSource} in ('ollama', 'cloudflare')`,
    ),
    check(
      "chat_conversation_ai_url_encrypted_check",
      sql`${table.aiUrl} is null or ${table.aiUrl} like 'enc:v1:%'`,
    ),
    check(
      "chat_conversation_ai_api_key_encrypted_check",
      sql`${table.aiApiKey} is null or ${table.aiApiKey} like 'enc:v1:%'`,
    ),
  ],
);

export const chatMessages = pgTable(
  "chat_message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversationId").notNull(),
    /**
     * Denormalized so every RLS policy is a single join. Kept honest by the
     * composite FK below rather than by convention.
     */
    homeId: uuid("homeId").notNull(),
    role: text("role").$type<ChatMessageRole>().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("chat_message_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    /**
     * Replaces the two separate FKs to `chat_conversation` and `home`. Those
     * allowed a row to name a conversation in home B while claiming
     * `homeId = A`: both FKs were satisfied and the RLS check, which reads only
     * `homeId`, passed. This makes the pair itself the referenced key.
     */
    foreignKey({
      name: "chat_message_conversation_home_fk",
      columns: [table.conversationId, table.homeId],
      foreignColumns: [chatConversations.id, chatConversations.homeId],
    }).onDelete("cascade"),
    check(
      "chat_message_role_check",
      sql`${table.role} in ('user', 'assistant', 'system')`,
    ),
    /**
     * Content is always ciphertext. This is the structural half of the
     * defence: `decryptChatText` returns non-prefixed input unchanged, so
     * without this CHECK a client could write plaintext and have it read back
     * as if decrypted.
     */
    check(
      "chat_message_content_encrypted_check",
      sql`${table.content} like 'enc:v1:%'`,
    ),
    /**
     * A bound on *ciphertext*. The real 8000-character plaintext limit is
     * enforced in the chat Edge Function, which is the only writer; this is
     * just a backstop against unbounded rows.
     */
    check(
      "chat_message_content_length_check",
      sql`char_length(${table.content}) <= 32000`,
    ),
  ],
);

export const userAiKeys = pgTable(
  "user_ai_key",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source").$type<AiKeySource>().notNull(),
    /** Encrypted (Ollama base URL). */
    url: text("url"),
    model: text("model"),
    accountId: text("accountId"),
    /** Encrypted (Cloudflare API token). */
    apiKey: text("apiKey"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_ai_key_user_source_idx").on(table.userId, table.source),
    check(
      "user_ai_key_source_check",
      sql`${table.source} in ('ollama', 'cloudflare')`,
    ),
    /**
     * Without these, a client could PATCH `url` to plaintext
     * `http://169.254.169.254/...` and the chat function would decrypt it to
     * itself and fetch it. Writes are revoked too; this makes plaintext
     * unrepresentable rather than merely unreachable.
     */
    check(
      "user_ai_key_url_encrypted_check",
      sql`${table.url} is null or ${table.url} like 'enc:v1:%'`,
    ),
    check(
      "user_ai_key_api_key_encrypted_check",
      sql`${table.apiKey} is null or ${table.apiKey} like 'enc:v1:%'`,
    ),
  ],
);

/**
 * Home-scoped pantry ingredients. Nutrition is per serving; recipes multiply
 * by quantity at read time and never store totals on the recipe row.
 */
export const ingredients = pgTable(
  "ingredient",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    servingSizeGrams: numeric("servingSizeGrams"),
    calories: numeric("calories"),
    carbsGrams: numeric("carbsGrams"),
    fatsGrams: numeric("fatsGrams"),
    proteinGrams: numeric("proteinGrams"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("ingredient_home_name_idx").on(table.homeId, table.name),
    unique("ingredient_id_home_key").on(table.id, table.homeId),
    check(
      "ingredient_name_length_check",
      sql`char_length(${table.name}) between 1 and 80`,
    ),
    check(
      "ingredient_serving_size_check",
      sql`${table.servingSizeGrams} is null or ${table.servingSizeGrams} >= 0`,
    ),
    check(
      "ingredient_calories_check",
      sql`${table.calories} is null or ${table.calories} >= 0`,
    ),
    check(
      "ingredient_carbs_check",
      sql`${table.carbsGrams} is null or ${table.carbsGrams} >= 0`,
    ),
    check(
      "ingredient_fats_check",
      sql`${table.fatsGrams} is null or ${table.fatsGrams} >= 0`,
    ),
    check(
      "ingredient_protein_check",
      sql`${table.proteinGrams} is null or ${table.proteinGrams} >= 0`,
    ),
  ],
);

export const recipes = pgTable(
  "recipe",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("recipe_home_name_idx").on(table.homeId, table.name),
    unique("recipe_id_home_key").on(table.id, table.homeId),
    check(
      "recipe_name_length_check",
      sql`char_length(${table.name}) between 1 and 120`,
    ),
  ],
);

export const recipeIngredients = pgTable(
  "recipe_ingredient",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipeId: uuid("recipeId").notNull(),
    ingredientId: uuid("ingredientId").notNull(),
    /**
     * Denormalized so RLS is a single join, kept honest by the composite FKs.
     */
    homeId: uuid("homeId").notNull(),
    quantity: numeric("quantity").notNull().default("1"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("recipe_ingredient_recipe_ingredient_key").on(
      table.recipeId,
      table.ingredientId,
    ),
    index("recipe_ingredient_recipe_idx").on(table.recipeId),
    foreignKey({
      name: "recipe_ingredient_recipe_home_fk",
      columns: [table.recipeId, table.homeId],
      foreignColumns: [recipes.id, recipes.homeId],
    }).onDelete("cascade"),
    foreignKey({
      name: "recipe_ingredient_ingredient_home_fk",
      columns: [table.ingredientId, table.homeId],
      foreignColumns: [ingredients.id, ingredients.homeId],
    }).onDelete("cascade"),
    check(
      "recipe_ingredient_quantity_check",
      sql`${table.quantity} > 0`,
    ),
  ],
);

export const groceryItems = pgTable(
  "grocery_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isCompleted: boolean("isCompleted").notNull().default(false),
    /** Always the Monday of the target week, as a calendar date. */
    weekStartDate: date("weekStartDate").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("grocery_item_home_week_completed_idx").on(
      table.homeId,
      table.weekStartDate,
      table.isCompleted,
    ),
    check(
      "grocery_item_name_length_check",
      sql`char_length(${table.name}) between 1 and 120`,
    ),
  ],
);

export const mealPlanEntries = pgTable(
  "meal_plan_entry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeId: uuid("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    recipeId: uuid("recipeId"),
    customName: text("customName"),
    date: date("date").notNull(),
    mealType: text("mealType").$type<MealType>().notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("meal_plan_entry_home_date_idx").on(table.homeId, table.date),
    /**
     * MATCH SIMPLE: a null recipeId skips the check so custom-name-only rows
     * are allowed.
     */
    foreignKey({
      name: "meal_plan_entry_recipe_home_fk",
      columns: [table.recipeId, table.homeId],
      foreignColumns: [recipes.id, recipes.homeId],
    }).onDelete("cascade"),
    check(
      "meal_plan_entry_meal_type_check",
      sql`${table.mealType} in ('breakfast', 'lunch', 'dinner', 'snack')`,
    ),
    check(
      "meal_plan_entry_has_meal_check",
      sql`${table.recipeId} is not null or ${table.customName} is not null`,
    ),
    check(
      "meal_plan_entry_custom_name_length_check",
      sql`${table.customName} is null or char_length(${table.customName}) between 1 and 120`,
    ),
  ],
);

import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
  AdapterAccountType,
} from "next-auth/adapters";
import type {
  AiKeySource,
  ChatMessageRole,
  HomeMemberRole,
  TaskStatus,
} from "../../lib/types";

export type {
  AiKeySource,
  ChatMessageRole,
  HomeMemberRole,
  TaskStatus,
} from "../../lib/types";
export {
  AI_KEY_SOURCES,
  CHAT_MESSAGE_ROLES,
  HOME_MEMBER_ROLES,
  TASK_STATUSES,
} from "../../lib/types";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("passwordHash"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const homes = pgTable(
  "home",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    createdByUserId: text("createdByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("home_one_per_creator").on(table.createdByUserId)],
);

export const homeMembers = pgTable(
  "home_member",
  {
    homeId: text("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<HomeMemberRole>().notNull().default("member"),
    joinedAt: timestamp("joinedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.homeId, table.userId] })],
);

export const tasks = pgTable(
  "task",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    homeId: text("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").$type<TaskStatus>().notNull().default("not_started"),
    position: integer("position").notNull().default(0),
    createdByUserId: text("createdByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("task_home_status_position_idx").on(
      table.homeId,
      table.status,
      table.position,
    ),
  ],
);

export const chatConversations = pgTable(
  "chat_conversation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    homeId: text("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    systemPrompt: text("systemPrompt"),
    aiSource: text("aiSource").$type<AiKeySource>(),
    aiModel: text("aiModel"),
    aiUrl: text("aiUrl"),
    aiAccountId: text("aiAccountId"),
    aiApiKey: text("aiApiKey"),
    createdByUserId: text("createdByUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("chat_conversation_home_updated_idx").on(
      table.homeId,
      table.updatedAt,
    ),
  ],
);

export const chatMessages = pgTable(
  "chat_message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversationId")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    homeId: text("homeId")
      .notNull()
      .references(() => homes.id, { onDelete: "cascade" }),
    role: text("role").$type<ChatMessageRole>().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("chat_message_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const userAiKeys = pgTable(
  "user_ai_key",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source").$type<AiKeySource>().notNull(),
    url: text("url"),
    model: text("model"),
    accountId: text("accountId"),
    apiKey: text("apiKey"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_ai_key_user_source_idx").on(table.userId, table.source),
  ],
);

import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  bigint,
  char,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: text("role").notNull().default("viewer"),
    passphraseHash: text("passphrase_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    check("users_role_check", sql`role IN ('viewer', 'admin')`),
  ]
);

export const chapters = pgTable(
  "chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_chapters_user_sort").on(table.userId, table.sortOrder),
  ]
);

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chapterId: uuid("chapter_id").references(() => chapters.id, {
      onDelete: "set null",
    }),
    kind: text("kind").notNull().default("standard"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    bodyText: text("body_text"),
    memoryDate: date("memory_date"),
    location: jsonb("location").$type<{
      name?: string;
      lat?: number;
      lng?: number;
    }>(),
    emotion: text("emotion"),
    threadKey: varchar("thread_key", { length: 255 }),
    sortOrder: integer("sort_order").notNull().default(0),
    isFavorite: boolean("is_favorite").notNull().default(false),
    isDraft: boolean("is_draft").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    purgeAfter: timestamp("purge_after", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_memories_user_date").on(table.userId, table.memoryDate),
    index("idx_memories_user_chapter").on(table.userId, table.chapterId),
    index("idx_memories_user_favorite").on(table.userId, table.isFavorite),
    index("idx_memories_deleted").on(table.deletedAt),
    check(
      "memories_kind_check",
      sql`kind IN ('standard', 'letter', 'milestone', 'future')`
    ),
    check(
      "memories_emotion_check",
      sql`emotion IS NULL OR emotion IN ('joy','nostalgia','longing','peace','excitement','gratitude','wonder')`
    ),
  ]
);

export const memoryAssets = pgTable(
  "memory_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memoryId: uuid("memory_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status").notNull().default("PENDING"),
    storageKey: text("storage_key").notNull().unique(),
    filename: varchar("filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    checksumSha256: char("checksum_sha256", { length: 64 }),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    isPrimary: boolean("is_primary").notNull().default(false),
    variants: jsonb("variants").$type<Record<string, string>>(),
    errorCode: text("error_code"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    purgeAfter: timestamp("purge_after", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_assets_memory").on(table.memoryId),
    index("idx_assets_status").on(table.status),
    check(
      "memory_assets_type_check",
      sql`type IN ('image','video','audio','document')`
    ),
    check(
      "memory_assets_status_check",
      sql`status IN ('PENDING','UPLOAD_AUTHORIZED','UPLOADING','PROCESSING','READY','FAILED','DELETED')`
    ),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: char("token_hash", { length: 64 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_sessions_user").on(table.userId),
    index("idx_sessions_expiry").on(table.expiresAt),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 80 }).notNull(),
    resourceType: varchar("resource_type", { length: 80 }),
    resourceId: uuid("resource_id"),
    outcome: varchar("outcome", { length: 20 }).notNull().default("success"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_audit_user_time").on(table.userId, table.createdAt),
    index("idx_audit_time").on(table.createdAt),
    check(
      "audit_logs_outcome_check",
      sql`outcome IN ('success','failure')`
    ),
  ]
);

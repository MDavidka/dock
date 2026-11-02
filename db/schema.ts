import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), hostHash: text("host_hash").notNull().unique(), joinHash: text("join_hash").notNull().unique(),
  createdAt: integer("created_at").notNull(), expiresAt: integer("expires_at").notNull(), joinedAt: integer("joined_at"),
  deviceName: text("device_name"), revokedAt: integer("revoked_at")
});
export const files = sqliteTable("files", {
  id: text("id").primaryKey(), sessionId: text("session_id").notNull().references(() => sessions.id),
  objectKey: text("object_key").notNull(), name: text("name").notNull(), size: integer("size").notNull(),
  mime: text("mime").notNull(), sender: text("sender").notNull(), createdAt: integer("created_at").notNull()
});

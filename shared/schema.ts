import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  hostname: text("hostname").notNull(),
  ip: text("ip").notNull(),
  displayName: text("display_name"),
  status: text("status", { enum: ["online", "offline", "unknown"] }).notNull().default("unknown"),
  responseTime: integer("response_time"), // in milliseconds
  lastPing: timestamp("last_ping"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pingLogs = pgTable("ping_logs", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  status: text("status", { enum: ["success", "failed"] }).notNull(),
  responseTime: integer("response_time"), // in milliseconds, null if failed
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  pingInterval: integer("ping_interval").notNull().default(60), // in seconds
  timeout: integer("timeout").notNull().default(10), // in seconds
  autoRefresh: boolean("auto_refresh").notNull().default(true),
});

export const insertServerSchema = createInsertSchema(servers).pick({
  hostname: true,
  ip: true,
  displayName: true,
});

export const insertPingLogSchema = createInsertSchema(pingLogs).pick({
  serverId: true,
  status: true,
  responseTime: true,
  details: true,
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  pingInterval: true,
  timeout: true,
  autoRefresh: true,
});

export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;
export type InsertPingLog = z.infer<typeof insertPingLogSchema>;
export type PingLog = typeof pingLogs.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

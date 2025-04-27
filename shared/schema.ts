import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Calendar settings schema
export const calendarSettingsSchema = z.object({
  theme: z.enum(["dark", "light"]).default("dark"),
  startOfWeek: z.enum(["sunday", "monday"]).default("sunday"),
  timeFormat: z.enum(["12h", "24h"]).default("12h"),
  eventDisplayMode: z.enum(["dots", "text", "box", "color"]).default("dots"),
});

// Calendar settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  theme: text("theme").notNull().default("dark"),
  startOfWeek: text("start_of_week").notNull().default("sunday"),
  timeFormat: text("time_format").notNull().default("12h"),
  eventDisplayMode: text("event_display_mode").notNull().default("dots"),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  userId: true,
  theme: true,
  startOfWeek: true,
  timeFormat: true,
  eventDisplayMode: true,
});

// Calendar events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  allDay: boolean("all_day").notNull().default(false),
  color: text("color").default("#3498db"),
  location: text("location"),
  notifications: boolean("notifications").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
}));

export const insertEventSchema = createInsertSchema(events).pick({
  userId: true,
  title: true, 
  description: true,
  startDate: true,
  endDate: true,
  allDay: true,
  color: true,
  location: true,
  notifications: true,
});

export const eventSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  startDate: z.date(),
  endDate: z.date(),
  allDay: z.boolean().default(false),
  color: z.string().default("#3498db"),
  location: z.string().nullable().optional(),
  notifications: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CalendarSettings = z.infer<typeof calendarSettingsSchema>;
export type InsertCalendarSettings = z.infer<typeof insertSettingsSchema>;
export type CalendarSetting = typeof settings.$inferSelect;

export type Event = z.infer<typeof eventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type DbEvent = typeof events.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

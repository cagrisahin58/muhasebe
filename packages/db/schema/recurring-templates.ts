import { pgTable, uuid, varchar, text, date, timestamp, index, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { users } from "./users.js";

/**
 * Tekrarlayan İşlem Şablonları
 * Kira, maaş, abonelik gibi periyodik muhasebe kayıtları
 */
export const recurringTemplates = pgTable(
  "recurring_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    frequency: varchar("frequency", { length: 20 }).notNull(), // daily, weekly, monthly, quarterly, yearly
    dayOfMonth: integer("day_of_month"), // Ayın kaçı (monthly için)
    nextRunDate: date("next_run_date", { mode: "date" }).notNull(),
    lastRunDate: date("last_run_date", { mode: "date" }),
    endDate: date("end_date", { mode: "date" }), // null = süresiz
    isActive: boolean("is_active").notNull().default(true),
    // Şablon fiş verileri
    entryType: varchar("entry_type", { length: 20 }).notNull(),
    lines: jsonb("lines").notNull().default([]),
    // [ { accountId, debitAmount, creditAmount, description } ]
    createdBy: uuid("created_by").notNull().references(() => users.id),
    runCount: integer("run_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_recurring_tenant").on(table.tenantId),
    index("idx_recurring_next_run").on(table.tenantId, table.nextRunDate),
  ]
);

/**
 * Bildirimler
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id),
    type: varchar("type", { length: 30 }).notNull(),
    // tax_deadline, check_due, invoice_overdue, recurring_reminder, system
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    actionUrl: varchar("action_url", { length: 500 }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_notifications_user").on(table.userId, table.isRead),
    index("idx_notifications_tenant").on(table.tenantId),
  ]
);

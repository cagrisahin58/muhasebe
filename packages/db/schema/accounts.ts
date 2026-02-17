import { pgTable, uuid, varchar, integer, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    parentId: uuid("parent_id"),
    type: varchar("type", { length: 20 }).notNull(), // asset, liability, equity, revenue, expense
    level: integer("level").notNull().default(1),
    isSystem: boolean("is_system").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_account_tenant_code").on(table.tenantId, table.code),
    index("idx_accounts_tenant").on(table.tenantId),
    index("idx_accounts_parent").on(table.parentId),
    index("idx_accounts_code").on(table.tenantId, table.code),
  ]
);

export const accountBalances = pgTable(
  "account_balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
    debitTotal: varchar("debit_total", { length: 20 }).notNull().default("0"),
    creditTotal: varchar("credit_total", { length: 20 }).notNull().default("0"),
    balance: varchar("balance", { length: 20 }).notNull().default("0"),
  },
  (table) => [
    unique("uq_balance_account_period").on(table.accountId, table.period),
    index("idx_balances_account_period").on(table.accountId, table.period),
  ]
);

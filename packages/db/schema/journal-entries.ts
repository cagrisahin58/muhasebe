import {
  pgTable,
  uuid,
  integer,
  date,
  varchar,
  text,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants.js";
import { fiscalYears } from "./fiscal-years.js";
import { users } from "./users.js";
import { accounts } from "./accounts.js";
import { contacts } from "./contacts.js";

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    fiscalYearId: uuid("fiscal_year_id").notNull().references(() => fiscalYears.id),
    entryNo: integer("entry_no").notNull(),
    entryDate: date("entry_date", { mode: "date" }).notNull(),
    entryType: varchar("entry_type", { length: 20 }).notNull(), // mahsup, tahsil, tediye, acilis, kapanis
    description: text("description").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, approved, rejected, reversed
    createdBy: uuid("created_by").notNull().references(() => users.id),
    approvedBy: uuid("approved_by").references(() => users.id),
    reversedEntryId: uuid("reversed_entry_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_journal_entries_tenant_date").on(table.tenantId, table.entryDate),
    index("idx_journal_entries_tenant_status").on(table.tenantId, table.status),
    index("idx_journal_entries_fiscal_year").on(table.fiscalYearId),
  ]
);

export const journalLines = pgTable(
  "journal_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull().references(() => accounts.id),
    debitAmount: varchar("debit_amount", { length: 20 }).notNull().default("0"),
    creditAmount: varchar("credit_amount", { length: 20 }).notNull().default("0"),
    description: text("description"),
    contactId: uuid("contact_id").references(() => contacts.id),
    currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
    exchangeRate: varchar("exchange_rate", { length: 20 }).notNull().default("1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_journal_lines_entry").on(table.entryId),
    index("idx_journal_lines_account").on(table.accountId),
    index("idx_journal_lines_contact").on(table.contactId),
    check("chk_debit_or_credit", sql`(
      (${table.debitAmount}::numeric > 0 AND ${table.creditAmount}::numeric = 0)
      OR (${table.debitAmount}::numeric = 0 AND ${table.creditAmount}::numeric > 0)
    )`),
  ]
);

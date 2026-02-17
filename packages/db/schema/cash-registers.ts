import { pgTable, uuid, varchar, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { contacts } from "./contacts.js";

/**
 * Kasa Hesapları
 *
 * Tekdüzen Hesap Planı: 100 Kasa
 * Birden fazla kasa (TL kasa, döviz kasası) tanımlanabilir.
 */
export const cashRegisters = pgTable(
  "cash_registers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(), // Ana Kasa, Döviz Kasası vs
    currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
    ledgerAccountId: uuid("ledger_account_id"), // Muhasebe hesabı (100.xx)
    currentBalance: varchar("current_balance", { length: 20 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_cash_registers_tenant").on(table.tenantId),
  ]
);

/**
 * Kasa Hareketleri
 */
export const cashTransactions = pgTable(
  "cash_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cashRegisterId: uuid("cash_register_id").notNull().references(() => cashRegisters.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    transactionDate: date("transaction_date", { mode: "date" }).notNull(),
    transactionType: varchar("transaction_type", { length: 20 }).notNull(), // income, expense, transfer
    description: text("description").notNull(),
    amount: varchar("amount", { length: 20 }).notNull(),
    contactId: uuid("contact_id").references(() => contacts.id),
    journalEntryId: uuid("journal_entry_id"),
    reference: varchar("reference", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_cash_tx_register_date").on(table.cashRegisterId, table.transactionDate),
    index("idx_cash_tx_tenant").on(table.tenantId),
  ]
);

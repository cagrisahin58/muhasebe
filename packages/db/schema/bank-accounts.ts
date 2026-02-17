import { pgTable, uuid, varchar, text, date, timestamp, index, integer, boolean } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { contacts } from "./contacts.js";

/**
 * Banka Hesapları
 */
export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    bankName: varchar("bank_name", { length: 100 }).notNull(),
    branchName: varchar("branch_name", { length: 100 }),
    branchCode: varchar("branch_code", { length: 20 }),
    accountNo: varchar("account_no", { length: 50 }).notNull(),
    iban: varchar("iban", { length: 34 }),
    currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
    accountType: varchar("account_type", { length: 20 }).notNull().default("checking"), // checking, savings, credit
    ledgerAccountId: uuid("ledger_account_id"), // Muhasebe hesabı (102.xx)
    isActive: boolean("is_active").notNull().default(true),
    currentBalance: varchar("current_balance", { length: 20 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_bank_accounts_tenant").on(table.tenantId),
    index("idx_bank_accounts_iban").on(table.tenantId, table.iban),
  ]
);

/**
 * Banka Hareketleri (Ekstre Satırları)
 */
export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bankAccountId: uuid("bank_account_id").notNull().references(() => bankAccounts.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    transactionDate: date("transaction_date", { mode: "date" }).notNull(),
    valueDate: date("value_date", { mode: "date" }),
    description: text("description").notNull(),
    reference: varchar("reference", { length: 100 }),
    amount: varchar("amount", { length: 20 }).notNull(), // + veya - olabilir
    balance: varchar("balance", { length: 20 }),
    transactionType: varchar("transaction_type", { length: 20 }).notNull(), // deposit, withdrawal, transfer, fee, interest
    contactId: uuid("contact_id").references(() => contacts.id),
    // Mutabakat
    isReconciled: boolean("is_reconciled").notNull().default(false),
    journalEntryId: uuid("journal_entry_id"), // Eşleştirilen muhasebe fişi
    importSource: varchar("import_source", { length: 20 }), // manual, csv, ofx, mt940, api
    importBatchId: varchar("import_batch_id", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_bank_tx_account_date").on(table.bankAccountId, table.transactionDate),
    index("idx_bank_tx_tenant").on(table.tenantId),
    index("idx_bank_tx_reconciled").on(table.bankAccountId, table.isReconciled),
  ]
);

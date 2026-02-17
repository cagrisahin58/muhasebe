import { pgTable, uuid, varchar, text, date, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { contacts } from "./contacts.js";

/**
 * Çek/Senet Portföyü
 *
 * Tekdüzen Hesap Planı:
 * - 101 Alınan Çekler
 * - 103 Verilen Çekler ve Ödeme Emirleri
 * - 121 Alacak Senetleri
 * - 321 Borç Senetleri
 */
export const checks = pgTable(
  "checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    checkType: varchar("check_type", { length: 20 }).notNull(), // received_check, given_check, received_note, given_note
    serialNo: varchar("serial_no", { length: 50 }).notNull(),
    contactId: uuid("contact_id").notNull().references(() => contacts.id),
    bankName: varchar("bank_name", { length: 100 }),
    branchName: varchar("branch_name", { length: 100 }),
    accountNo: varchar("account_no", { length: 50 }),
    amount: varchar("amount", { length: 20 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
    issueDate: date("issue_date", { mode: "date" }).notNull(),
    dueDate: date("due_date", { mode: "date" }).notNull(),
    // Çek/Senet durumu
    status: varchar("status", { length: 20 }).notNull().default("portfolio"),
    // portfolio (portföyde), in_collection (tahsilde), collected (tahsil edildi),
    // endorsed (ciro edildi), bounced (karşılıksız), paid (ödendi), cancelled (iptal)
    endorsedTo: uuid("endorsed_to").references(() => contacts.id), // Ciro edilen kişi
    endorsedDate: date("endorsed_date", { mode: "date" }),
    collectionDate: date("collection_date", { mode: "date" }),
    bouncedDate: date("bounced_date", { mode: "date" }),
    notes: text("notes"),
    journalEntryId: uuid("journal_entry_id"), // İlgili muhasebe fişi
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_checks_tenant_type").on(table.tenantId, table.checkType),
    index("idx_checks_due_date").on(table.tenantId, table.dueDate),
    index("idx_checks_status").on(table.tenantId, table.status),
    index("idx_checks_contact").on(table.contactId),
  ]
);

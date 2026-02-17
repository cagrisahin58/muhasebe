import { pgTable, uuid, varchar, text, date, timestamp, index, integer } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { contacts } from "./contacts.js";
import { journalEntries } from "./journal-entries.js";

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").notNull().references(() => contacts.id),
    invoiceNo: varchar("invoice_no", { length: 16 }).notNull(),
    invoiceDate: date("invoice_date", { mode: "date" }).notNull(),
    dueDate: date("due_date", { mode: "date" }),
    type: varchar("type", { length: 20 }).notNull(), // sale, purchase, sale_return, purchase_return
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    subtotal: varchar("subtotal", { length: 20 }).notNull().default("0"),
    discountTotal: varchar("discount_total", { length: 20 }).notNull().default("0"),
    taxTotal: varchar("tax_total", { length: 20 }).notNull().default("0"),
    grandTotal: varchar("grand_total", { length: 20 }).notNull().default("0"),
    currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
    exchangeRate: varchar("exchange_rate", { length: 20 }).notNull().default("1"),
    notes: text("notes"),
    eInvoiceStatus: varchar("e_invoice_status", { length: 20 }),
    eInvoiceUuid: uuid("e_invoice_uuid"),
    journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_invoices_tenant_date").on(table.tenantId, table.invoiceDate),
    index("idx_invoices_contact").on(table.contactId),
    index("idx_invoices_tenant_no").on(table.tenantId, table.invoiceNo),
  ]
);

export const invoiceLines = pgTable(
  "invoice_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
    lineNo: integer("line_no").notNull().default(1),
    description: text("description").notNull(),
    quantity: varchar("quantity", { length: 20 }).notNull(),
    unitPrice: varchar("unit_price", { length: 20 }).notNull(),
    discountRate: varchar("discount_rate", { length: 10 }).notNull().default("0"),
    taxRate: integer("tax_rate").notNull().default(20),
    withholdingRate: varchar("withholding_rate", { length: 10 }),
    lineTotal: varchar("line_total", { length: 20 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_invoice_lines_invoice").on(table.invoiceId),
  ]
);

import { pgTable, uuid, varchar, text, date, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";

/**
 * Vergi Beyannameleri
 *
 * KDV-1, Muhtasar, Geçici Vergi, Yıllık Gelir/Kurumlar Vergisi
 */
export const taxDeclarations = pgTable(
  "tax_declarations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    declarationType: varchar("declaration_type", { length: 30 }).notNull(),
    // kdv1, kdv2, muhtasar, gecici_vergi, yillik_gelir, yillik_kurumlar, damga
    period: varchar("period", { length: 10 }).notNull(), // YYYY-MM veya YYYY-Q1/Q2/Q3/Q4
    periodStart: date("period_start", { mode: "date" }).notNull(),
    periodEnd: date("period_end", { mode: "date" }).notNull(),
    dueDate: date("due_date", { mode: "date" }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    // draft, calculated, validated, submitted, accepted, revision_needed
    // Beyanname verileri (JSON formatında esnek yapı)
    data: jsonb("data").notNull().default({}),
    // Toplam tutarlar
    taxableAmount: varchar("taxable_amount", { length: 20 }).notNull().default("0"),
    taxAmount: varchar("tax_amount", { length: 20 }).notNull().default("0"),
    penaltyAmount: varchar("penalty_amount", { length: 20 }).notNull().default("0"),
    totalAmount: varchar("total_amount", { length: 20 }).notNull().default("0"),
    // Gönderim bilgileri
    submissionDate: date("submission_date", { mode: "date" }),
    submissionRef: varchar("submission_ref", { length: 100 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_tax_decl_tenant_type").on(table.tenantId, table.declarationType),
    index("idx_tax_decl_period").on(table.tenantId, table.period),
    index("idx_tax_decl_due_date").on(table.tenantId, table.dueDate),
  ]
);

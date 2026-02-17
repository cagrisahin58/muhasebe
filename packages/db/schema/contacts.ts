import { pgTable, uuid, varchar, text, timestamp, boolean, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // customer, supplier, both
    taxId: varchar("tax_id", { length: 11 }).notNull(),
    name: varchar("name", { length: 300 }).notNull(),
    shortName: varchar("short_name", { length: 50 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    city: varchar("city", { length: 50 }),
    district: varchar("district", { length: 50 }),
    taxOffice: varchar("tax_office", { length: 100 }),
    creditLimit: varchar("credit_limit", { length: 20 }),
    balance: varchar("balance", { length: 20 }).notNull().default("0"),
    tags: text("tags").array().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_contact_tenant_taxid").on(table.tenantId, table.taxId),
    index("idx_contacts_tenant").on(table.tenantId),
    index("idx_contacts_tenant_name").on(table.tenantId, table.name),
  ]
);

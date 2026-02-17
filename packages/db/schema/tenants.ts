import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  taxId: varchar("tax_id", { length: 11 }).notNull().unique(),
  taxOffice: varchar("tax_office", { length: 100 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  district: varchar("district", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  logo: text("logo"),
  settings: jsonb("settings").notNull().default({
    defaultCurrency: "TRY",
    defaultKdvRate: 20,
    fiscalYearStart: 1,
    invoicePrefix: "FNB",
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

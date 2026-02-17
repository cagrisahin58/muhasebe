import { pgTable, uuid, integer, date, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";

export const fiscalYears = pgTable(
  "fiscal_years",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    startDate: date("start_date", { mode: "date" }).notNull(),
    endDate: date("end_date", { mode: "date" }).notNull(),
    isClosed: boolean("is_closed").notNull().default(false),
    isCurrent: boolean("is_current").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_fiscal_year_tenant_year").on(table.tenantId, table.year),
    index("idx_fiscal_years_tenant").on(table.tenantId),
  ]
);

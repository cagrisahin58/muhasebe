import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, or, ilike, sql, desc, asc } from "drizzle-orm";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { contacts, journalLines, journalEntries, accounts } from "@finbooks/db";
import { createContactSchema, updateContactSchema, paginationSchema } from "@finbooks/shared";
import { createAuditLog } from "../middleware/audit.js";

export const contactsRouter = router({
  /** Cari hesap listesi */
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: z.string().optional(),
        ...paginationSchema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      const conditions = [
        eq(contacts.tenantId, ctx.user.tenantId),
        eq(contacts.isActive, true),
      ];

      if (input.type) {
        conditions.push(eq(contacts.type, input.type));
      }

      const where = and(...conditions);

      let items = await ctx.db
        .select()
        .from(contacts)
        .where(where)
        .orderBy(asc(contacts.name))
        .limit(pageSize)
        .offset(offset);

      if (input.search) {
        const s = input.search.toLowerCase();
        items = items.filter(
          (c) =>
            c.name.toLowerCase().includes(s) ||
            c.taxId.includes(s) ||
            (c.shortName?.toLowerCase().includes(s) ?? false)
        );
      }

      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(where);

      const total = countResult?.count ?? 0;

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /** Tek cari hesap detayı */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.db.query.contacts.findFirst({
        where: and(eq(contacts.id, input.id), eq(contacts.tenantId, ctx.user.tenantId)),
      });

      if (!contact) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cari hesap bulunamadı" });
      }

      return contact;
    }),

  /** Yeni cari hesap */
  create: accountantProcedure
    .input(createContactSchema)
    .mutation(async ({ ctx, input }) => {
      // Aynı VKN var mı?
      const existing = await ctx.db.query.contacts.findFirst({
        where: and(
          eq(contacts.tenantId, ctx.user.tenantId),
          eq(contacts.taxId, input.taxId)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${input.taxId} vergi numaralı cari hesap zaten mevcut: ${existing.name}`,
        });
      }

      const [contact] = await ctx.db
        .insert(contacts)
        .values({
          tenantId: ctx.user.tenantId,
          type: input.type,
          taxId: input.taxId,
          name: input.name,
          shortName: input.shortName ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          address: input.address ?? null,
          city: input.city ?? null,
          district: input.district ?? null,
          taxOffice: input.taxOffice ?? null,
          creditLimit: input.creditLimit ?? null,
          tags: input.tags ?? [],
        })
        .returning();

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "create",
        entityType: "contact",
        entityId: contact!.id,
        newValues: { name: input.name, taxId: input.taxId },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return contact;
    }),

  /** Cari hesap güncelle */
  update: accountantProcedure
    .input(z.object({ id: z.string().uuid(), data: updateContactSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.contacts.findFirst({
        where: and(eq(contacts.id, input.id), eq(contacts.tenantId, ctx.user.tenantId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cari hesap bulunamadı" });
      }

      const [updated] = await ctx.db
        .update(contacts)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(contacts.id, input.id))
        .returning();

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "update",
        entityType: "contact",
        entityId: input.id,
        oldValues: { name: existing.name },
        newValues: input.data,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return updated;
    }),

  /** Cari hesap ekstre */
  getStatement: protectedProcedure
    .input(
      z.object({
        contactId: z.string().uuid(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Cari hesabı kontrol et
      const contact = await ctx.db.query.contacts.findFirst({
        where: and(
          eq(contacts.id, input.contactId),
          eq(contacts.tenantId, ctx.user.tenantId)
        ),
      });

      if (!contact) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cari hesap bulunamadı" });
      }

      // İlgili yevmiye satırlarını al
      const lines = await ctx.db
        .select({
          lineId: journalLines.id,
          entryId: journalEntries.id,
          entryNo: journalEntries.entryNo,
          entryDate: journalEntries.entryDate,
          entryDescription: journalEntries.description,
          lineDescription: journalLines.description,
          accountCode: accounts.code,
          accountName: accounts.name,
          debitAmount: journalLines.debitAmount,
          creditAmount: journalLines.creditAmount,
        })
        .from(journalLines)
        .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
        .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
        .where(
          and(
            eq(journalLines.contactId, input.contactId),
            eq(journalEntries.tenantId, ctx.user.tenantId),
            eq(journalEntries.status, "approved"),
            between(journalEntries.entryDate, input.startDate, input.endDate)
          )
        )
        .orderBy(asc(journalEntries.entryDate), asc(journalEntries.entryNo));

      // Bakiye hesapla
      let runningBalance = 0;
      const statement = lines.map((line) => {
        const debit = parseFloat(line.debitAmount);
        const credit = parseFloat(line.creditAmount);
        runningBalance += debit - credit;
        return {
          ...line,
          balance: runningBalance.toFixed(2),
        };
      });

      return {
        contact,
        lines: statement,
        totalDebit: lines.reduce((sum, l) => sum + parseFloat(l.debitAmount), 0).toFixed(2),
        totalCredit: lines.reduce((sum, l) => sum + parseFloat(l.creditAmount), 0).toFixed(2),
        closingBalance: runningBalance.toFixed(2),
      };
    }),
});

function between(column: any, start: Date, end: Date) {
  return sql`${column} BETWEEN ${start.toISOString().split("T")[0]} AND ${end.toISOString().split("T")[0]}`;
}

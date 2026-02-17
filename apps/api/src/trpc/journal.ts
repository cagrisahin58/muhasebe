import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, between, desc, sql, asc } from "drizzle-orm";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import {
  journalEntries,
  journalLines,
  accounts,
  accountBalances,
  fiscalYears,
} from "@finbooks/db";
import { createJournalEntrySchema, paginationSchema } from "@finbooks/shared";
import { toPeriodString } from "@finbooks/shared";
import { createAuditLog } from "../middleware/audit.js";

export const journalRouter = router({
  /** Fiş listesi */
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        status: z.string().optional(),
        entryType: z.string().optional(),
        ...paginationSchema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      const conditions = [eq(journalEntries.tenantId, ctx.user.tenantId)];

      if (input.startDate && input.endDate) {
        conditions.push(between(journalEntries.entryDate, input.startDate, input.endDate));
      }
      if (input.status) {
        conditions.push(eq(journalEntries.status, input.status));
      }
      if (input.entryType) {
        conditions.push(eq(journalEntries.entryType, input.entryType));
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(journalEntries)
          .where(where)
          .orderBy(desc(journalEntries.entryDate), desc(journalEntries.entryNo))
          .limit(pageSize)
          .offset(offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(journalEntries)
          .where(where),
      ]);

      const total = countResult[0]?.count ?? 0;

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /** Fiş detayı (satırlarıyla birlikte) */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.db.query.journalEntries.findFirst({
        where: and(
          eq(journalEntries.id, input.id),
          eq(journalEntries.tenantId, ctx.user.tenantId)
        ),
      });

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fiş bulunamadı" });
      }

      const lines = await ctx.db
        .select({
          id: journalLines.id,
          entryId: journalLines.entryId,
          accountId: journalLines.accountId,
          accountCode: accounts.code,
          accountName: accounts.name,
          debitAmount: journalLines.debitAmount,
          creditAmount: journalLines.creditAmount,
          description: journalLines.description,
          contactId: journalLines.contactId,
          currency: journalLines.currency,
          exchangeRate: journalLines.exchangeRate,
        })
        .from(journalLines)
        .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
        .where(eq(journalLines.entryId, input.id))
        .orderBy(asc(journalLines.id));

      return { ...entry, lines };
    }),

  /** Yeni fiş oluştur */
  create: accountantProcedure
    .input(createJournalEntrySchema)
    .mutation(async ({ ctx, input }) => {
      // Aktif mali yılı bul
      const fiscalYear = await ctx.db.query.fiscalYears.findFirst({
        where: and(
          eq(fiscalYears.tenantId, ctx.user.tenantId),
          eq(fiscalYears.isCurrent, true)
        ),
      });

      if (!fiscalYear) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Aktif mali yıl bulunamadı" });
      }

      if (fiscalYear.isClosed) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Mali yıl kapatılmış" });
      }

      // Fiş tarihinin mali yıl içinde olup olmadığını kontrol et
      if (input.entryDate < fiscalYear.startDate || input.entryDate > fiscalYear.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fiş tarihi mali yıl dışında",
        });
      }

      // Sonraki fiş numarasını al
      const lastEntry = await ctx.db
        .select({ entryNo: journalEntries.entryNo })
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.tenantId, ctx.user.tenantId),
            eq(journalEntries.fiscalYearId, fiscalYear.id)
          )
        )
        .orderBy(desc(journalEntries.entryNo))
        .limit(1);

      const nextEntryNo = (lastEntry[0]?.entryNo ?? 0) + 1;

      // Hesapların varlığını kontrol et
      const accountIds = input.lines.map((l) => l.accountId);
      const existingAccounts = await ctx.db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.tenantId, ctx.user.tenantId),
            eq(accounts.isActive, true)
          )
        );

      const existingIds = new Set(existingAccounts.map((a) => a.id));
      for (const accId of accountIds) {
        if (!existingIds.has(accId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Hesap bulunamadı: ${accId}`,
          });
        }
      }

      // Fiş oluştur
      const [entry] = await ctx.db
        .insert(journalEntries)
        .values({
          tenantId: ctx.user.tenantId,
          fiscalYearId: fiscalYear.id,
          entryNo: nextEntryNo,
          entryDate: input.entryDate,
          entryType: input.entryType,
          description: input.description,
          status: "draft",
          createdBy: ctx.user.sub,
        })
        .returning();

      // Satırları oluştur
      await ctx.db.insert(journalLines).values(
        input.lines.map((line) => ({
          entryId: entry!.id,
          accountId: line.accountId,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          description: line.description ?? null,
          contactId: line.contactId ?? null,
          currency: line.currency ?? "TRY",
          exchangeRate: line.exchangeRate ?? "1",
        }))
      );

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "create",
        entityType: "journal_entry",
        entityId: entry!.id,
        newValues: { entryNo: nextEntryNo, description: input.description },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return entry;
    }),

  /** Fiş onayla */
  approve: accountantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.query.journalEntries.findFirst({
        where: and(
          eq(journalEntries.id, input.id),
          eq(journalEntries.tenantId, ctx.user.tenantId)
        ),
      });

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fiş bulunamadı" });
      }

      if (entry.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sadece taslak durumundaki fişler onaylanabilir",
        });
      }

      // Fişi onayla
      const [updated] = await ctx.db
        .update(journalEntries)
        .set({
          status: "approved",
          approvedBy: ctx.user.sub,
          updatedAt: new Date(),
        })
        .where(eq(journalEntries.id, input.id))
        .returning();

      // Hesap bakiyelerini güncelle
      const lines = await ctx.db
        .select()
        .from(journalLines)
        .where(eq(journalLines.entryId, input.id));

      const period = toPeriodString(entry.entryDate);

      for (const line of lines) {
        const existing = await ctx.db.query.accountBalances.findFirst({
          where: and(
            eq(accountBalances.accountId, line.accountId),
            eq(accountBalances.period, period)
          ),
        });

        if (existing) {
          const newDebitTotal = (
            parseFloat(existing.debitTotal) + parseFloat(line.debitAmount)
          ).toFixed(2);
          const newCreditTotal = (
            parseFloat(existing.creditTotal) + parseFloat(line.creditAmount)
          ).toFixed(2);
          const newBalance = (parseFloat(newDebitTotal) - parseFloat(newCreditTotal)).toFixed(2);

          await ctx.db
            .update(accountBalances)
            .set({
              debitTotal: newDebitTotal,
              creditTotal: newCreditTotal,
              balance: newBalance,
            })
            .where(eq(accountBalances.id, existing.id));
        } else {
          const balance = (
            parseFloat(line.debitAmount) - parseFloat(line.creditAmount)
          ).toFixed(2);

          await ctx.db.insert(accountBalances).values({
            accountId: line.accountId,
            period,
            debitTotal: line.debitAmount,
            creditTotal: line.creditAmount,
            balance,
          });
        }
      }

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "approve",
        entityType: "journal_entry",
        entityId: input.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return updated;
    }),

  /** Fiş reddet */
  reject: accountantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.query.journalEntries.findFirst({
        where: and(
          eq(journalEntries.id, input.id),
          eq(journalEntries.tenantId, ctx.user.tenantId)
        ),
      });

      if (!entry || entry.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sadece taslak durumundaki fişler reddedilebilir",
        });
      }

      const [updated] = await ctx.db
        .update(journalEntries)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(journalEntries.id, input.id))
        .returning();

      return updated;
    }),

  /** Ters kayıt ile fiş iptali */
  reverse: accountantProcedure
    .input(z.object({ id: z.string().uuid(), description: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.query.journalEntries.findFirst({
        where: and(
          eq(journalEntries.id, input.id),
          eq(journalEntries.tenantId, ctx.user.tenantId)
        ),
      });

      if (!entry || entry.status !== "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sadece onaylanmış fişler ters kayıtla iptal edilebilir",
        });
      }

      const lines = await ctx.db
        .select()
        .from(journalLines)
        .where(eq(journalLines.entryId, input.id));

      // Mali yılı bul
      const fiscalYear = await ctx.db.query.fiscalYears.findFirst({
        where: eq(fiscalYears.id, entry.fiscalYearId),
      });

      // Sonraki fiş numarası
      const lastEntry = await ctx.db
        .select({ entryNo: journalEntries.entryNo })
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.tenantId, ctx.user.tenantId),
            eq(journalEntries.fiscalYearId, entry.fiscalYearId)
          )
        )
        .orderBy(desc(journalEntries.entryNo))
        .limit(1);

      const nextEntryNo = (lastEntry[0]?.entryNo ?? 0) + 1;

      // Ters fiş oluştur
      const [reverseEntry] = await ctx.db
        .insert(journalEntries)
        .values({
          tenantId: ctx.user.tenantId,
          fiscalYearId: entry.fiscalYearId,
          entryNo: nextEntryNo,
          entryDate: new Date(),
          entryType: entry.entryType,
          description: `[TERS KAYIT] ${input.description}`,
          status: "approved",
          createdBy: ctx.user.sub,
          approvedBy: ctx.user.sub,
          reversedEntryId: entry.id,
        })
        .returning();

      // Borç-alacak ters çevrilmiş satırlar
      await ctx.db.insert(journalLines).values(
        lines.map((line) => ({
          entryId: reverseEntry!.id,
          accountId: line.accountId,
          debitAmount: line.creditAmount, // Ters
          creditAmount: line.debitAmount, // Ters
          description: `[TERS] ${line.description ?? ""}`.trim(),
          contactId: line.contactId,
          currency: line.currency,
          exchangeRate: line.exchangeRate,
        }))
      );

      // Orijinal fişi "reversed" yap
      await ctx.db
        .update(journalEntries)
        .set({ status: "reversed", updatedAt: new Date() })
        .where(eq(journalEntries.id, input.id));

      // Bakiyeleri güncelle (ters kayıt etkisi)
      const period = toPeriodString(new Date());
      for (const line of lines) {
        const existing = await ctx.db.query.accountBalances.findFirst({
          where: and(
            eq(accountBalances.accountId, line.accountId),
            eq(accountBalances.period, period)
          ),
        });

        // Ters değerleri ekle
        const debitAdd = parseFloat(line.creditAmount);
        const creditAdd = parseFloat(line.debitAmount);

        if (existing) {
          const newDebit = (parseFloat(existing.debitTotal) + debitAdd).toFixed(2);
          const newCredit = (parseFloat(existing.creditTotal) + creditAdd).toFixed(2);
          await ctx.db
            .update(accountBalances)
            .set({
              debitTotal: newDebit,
              creditTotal: newCredit,
              balance: (parseFloat(newDebit) - parseFloat(newCredit)).toFixed(2),
            })
            .where(eq(accountBalances.id, existing.id));
        } else {
          await ctx.db.insert(accountBalances).values({
            accountId: line.accountId,
            period,
            debitTotal: debitAdd.toFixed(2),
            creditTotal: creditAdd.toFixed(2),
            balance: (debitAdd - creditAdd).toFixed(2),
          });
        }
      }

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "update",
        entityType: "journal_entry",
        entityId: input.id,
        newValues: { status: "reversed", reverseEntryId: reverseEntry!.id },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return reverseEntry;
    }),
});

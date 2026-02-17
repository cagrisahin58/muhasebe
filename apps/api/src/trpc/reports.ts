import { z } from "zod";
import { eq, and, sql, asc, between } from "drizzle-orm";
import { router, protectedProcedure } from "./trpc.js";
import {
  accounts,
  accountBalances,
  journalEntries,
  journalLines,
} from "@finbooks/db";
import { trialBalanceQuerySchema, ledgerQuerySchema } from "@finbooks/shared";

export const reportsRouter = router({
  /** Mizan Raporu */
  trialBalance: protectedProcedure
    .input(trialBalanceQuerySchema)
    .query(async ({ ctx, input }) => {
      // Dönem aralığındaki tüm onaylanmış fişlerin hesap bazlı toplamları
      const result = await ctx.db
        .select({
          accountId: accounts.id,
          accountCode: accounts.code,
          accountName: accounts.name,
          accountType: accounts.type,
          accountLevel: accounts.level,
          totalDebit: sql<string>`COALESCE(SUM(${journalLines.debitAmount}::numeric), 0)::text`,
          totalCredit: sql<string>`COALESCE(SUM(${journalLines.creditAmount}::numeric), 0)::text`,
        })
        .from(accounts)
        .leftJoin(
          journalLines,
          eq(journalLines.accountId, accounts.id)
        )
        .leftJoin(
          journalEntries,
          and(
            eq(journalLines.entryId, journalEntries.id),
            eq(journalEntries.status, "approved"),
            sql`${journalEntries.entryDate} BETWEEN ${input.startDate.toISOString().split("T")[0]} AND ${input.endDate.toISOString().split("T")[0]}`
          )
        )
        .where(
          and(
            eq(accounts.tenantId, ctx.user.tenantId),
            eq(accounts.isActive, true)
          )
        )
        .groupBy(accounts.id, accounts.code, accounts.name, accounts.type, accounts.level)
        .orderBy(asc(accounts.code));

      // Seviye filtresi uygula ve bakiye hesapla
      const rows = result
        .filter((r) => r.accountLevel <= input.level)
        .map((r) => {
          const debit = parseFloat(r.totalDebit);
          const credit = parseFloat(r.totalCredit);
          const balance = debit - credit;
          return {
            accountCode: r.accountCode,
            accountName: r.accountName,
            accountType: r.accountType,
            level: r.accountLevel,
            openingDebit: "0.00",
            openingCredit: "0.00",
            periodDebit: debit.toFixed(2),
            periodCredit: credit.toFixed(2),
            closingDebit: balance >= 0 ? balance.toFixed(2) : "0.00",
            closingCredit: balance < 0 ? Math.abs(balance).toFixed(2) : "0.00",
          };
        })
        .filter((r) => parseFloat(r.periodDebit) > 0 || parseFloat(r.periodCredit) > 0);

      // Toplamlar
      const totals = rows.reduce(
        (acc, r) => ({
          totalDebit: acc.totalDebit + parseFloat(r.periodDebit),
          totalCredit: acc.totalCredit + parseFloat(r.periodCredit),
          closingDebit: acc.closingDebit + parseFloat(r.closingDebit),
          closingCredit: acc.closingCredit + parseFloat(r.closingCredit),
        }),
        { totalDebit: 0, totalCredit: 0, closingDebit: 0, closingCredit: 0 }
      );

      return {
        rows,
        totals: {
          totalDebit: totals.totalDebit.toFixed(2),
          totalCredit: totals.totalCredit.toFixed(2),
          closingDebit: totals.closingDebit.toFixed(2),
          closingCredit: totals.closingCredit.toFixed(2),
        },
        period: {
          startDate: input.startDate,
          endDate: input.endDate,
        },
      };
    }),

  /** Kebir (Büyük Defter) */
  generalLedger: protectedProcedure
    .input(ledgerQuerySchema)
    .query(async ({ ctx, input }) => {
      // Hesap bilgisi
      const account = await ctx.db.query.accounts.findFirst({
        where: and(
          eq(accounts.id, input.accountId),
          eq(accounts.tenantId, ctx.user.tenantId)
        ),
      });

      if (!account) {
        return { account: null, lines: [], totals: { debit: "0.00", credit: "0.00", balance: "0.00" } };
      }

      // Hesaba ait tüm hareketler
      const lines = await ctx.db
        .select({
          lineId: journalLines.id,
          entryId: journalEntries.id,
          entryNo: journalEntries.entryNo,
          entryDate: journalEntries.entryDate,
          entryType: journalEntries.entryType,
          description: journalEntries.description,
          lineDescription: journalLines.description,
          debitAmount: journalLines.debitAmount,
          creditAmount: journalLines.creditAmount,
          contactId: journalLines.contactId,
        })
        .from(journalLines)
        .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
        .where(
          and(
            eq(journalLines.accountId, input.accountId),
            eq(journalEntries.tenantId, ctx.user.tenantId),
            eq(journalEntries.status, "approved"),
            sql`${journalEntries.entryDate} BETWEEN ${input.startDate.toISOString().split("T")[0]} AND ${input.endDate.toISOString().split("T")[0]}`
          )
        )
        .orderBy(asc(journalEntries.entryDate), asc(journalEntries.entryNo));

      // Bakiye hesapla
      let runningBalance = 0;
      const linesWithBalance = lines.map((line) => {
        const debit = parseFloat(line.debitAmount);
        const credit = parseFloat(line.creditAmount);
        runningBalance += debit - credit;
        return {
          ...line,
          balance: runningBalance.toFixed(2),
        };
      });

      return {
        account: {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
        },
        lines: linesWithBalance,
        totals: {
          debit: lines.reduce((s, l) => s + parseFloat(l.debitAmount), 0).toFixed(2),
          credit: lines.reduce((s, l) => s + parseFloat(l.creditAmount), 0).toFixed(2),
          balance: runningBalance.toFixed(2),
        },
      };
    }),

  /** Yevmiye Defteri */
  journalBook: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const entries = await ctx.db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.tenantId, ctx.user.tenantId),
            eq(journalEntries.status, "approved"),
            sql`${journalEntries.entryDate} BETWEEN ${input.startDate.toISOString().split("T")[0]} AND ${input.endDate.toISOString().split("T")[0]}`
          )
        )
        .orderBy(asc(journalEntries.entryDate), asc(journalEntries.entryNo))
        .limit(input.pageSize)
        .offset(offset);

      // Her fiş için satırları al
      const entriesWithLines = await Promise.all(
        entries.map(async (entry) => {
          const lines = await ctx.db
            .select({
              id: journalLines.id,
              accountCode: accounts.code,
              accountName: accounts.name,
              debitAmount: journalLines.debitAmount,
              creditAmount: journalLines.creditAmount,
              description: journalLines.description,
            })
            .from(journalLines)
            .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
            .where(eq(journalLines.entryId, entry.id))
            .orderBy(asc(accounts.code));

          return { ...entry, lines };
        })
      );

      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.tenantId, ctx.user.tenantId),
            eq(journalEntries.status, "approved"),
            sql`${journalEntries.entryDate} BETWEEN ${input.startDate.toISOString().split("T")[0]} AND ${input.endDate.toISOString().split("T")[0]}`
          )
        );

      const total = countResult?.count ?? 0;

      return {
        entries: entriesWithLines,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),
});

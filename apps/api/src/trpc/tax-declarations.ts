import { z } from "zod";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { eq, and, desc, asc } from "drizzle-orm";
import { taxDeclarations, accountBalances, accounts } from "@finbooks/db";
import {
  calculateKdv1Declaration,
  calculateMuhtasar,
  calculateGeciciVergi,
} from "../services/kdv-declaration.calc.js";
import type { KdvByRate } from "../services/kdv-declaration.calc.js";

export const taxDeclarationsRouter = router({
  /** Beyanname listesi */
  list: protectedProcedure
    .input(
      z.object({
        declarationType: z.string().optional(),
        year: z.number().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.db
        .select()
        .from(taxDeclarations)
        .where(eq(taxDeclarations.tenantId, ctx.user.tenantId))
        .orderBy(desc(taxDeclarations.periodEnd))
        .limit(input.limit)
        .offset(input.offset);

      return query;
    }),

  /** Beyanname detay */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const declaration = await ctx.db.query.taxDeclarations.findFirst({
        where: and(
          eq(taxDeclarations.id, input.id),
          eq(taxDeclarations.tenantId, ctx.user.tenantId)
        ),
      });
      if (!declaration) throw new Error("Beyanname bulunamadı");
      return declaration;
    }),

  /** KDV-1 Beyannamesi otomatik hesapla */
  calculateKdv1: accountantProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.user.tenantId;

      // 391 Hesaplanan KDV hesap bakiyelerini çek
      const hesaplananKdvAccounts = await ctx.db
        .select({
          code: accounts.code,
          debitTotal: accountBalances.debitTotal,
          creditTotal: accountBalances.creditTotal,
        })
        .from(accountBalances)
        .innerJoin(accounts, eq(accounts.id, accountBalances.accountId))
        .where(
          and(
            eq(accounts.tenantId, tenantId),
            eq(accounts.code, "391"),
            eq(accountBalances.period, input.period)
          )
        );

      // 191 İndirilecek KDV hesap bakiyelerini çek
      const indirilecekKdvAccounts = await ctx.db
        .select({
          code: accounts.code,
          debitTotal: accountBalances.debitTotal,
          creditTotal: accountBalances.creditTotal,
        })
        .from(accountBalances)
        .innerJoin(accounts, eq(accounts.id, accountBalances.accountId))
        .where(
          and(
            eq(accounts.tenantId, tenantId),
            eq(accounts.code, "191"),
            eq(accountBalances.period, input.period)
          )
        );

      // Önceki dönem devreden KDV'yi bul
      const prevMonth = getPreviousMonth(input.period);
      const prevDeclaration = await ctx.db.query.taxDeclarations.findFirst({
        where: and(
          eq(taxDeclarations.tenantId, tenantId),
          eq(taxDeclarations.declarationType, "kdv1"),
          eq(taxDeclarations.period, prevMonth)
        ),
      });
      const prevCarryOver = prevDeclaration
        ? parseFloat((prevDeclaration.data as { carryOverKdv?: string })?.carryOverKdv ?? "0")
        : 0;

      // Hesaplanan KDV -> default %20 oranında göster
      const calculatedTotal = hesaplananKdvAccounts.reduce(
        (s, a) => s + parseFloat(a.creditTotal),
        0
      );
      const deductibleTotal = indirilecekKdvAccounts.reduce(
        (s, a) => s + parseFloat(a.debitTotal),
        0
      );

      const calculatedKdv: KdvByRate[] = [
        { rate: 20, taxableAmount: calculatedTotal * 5, taxAmount: calculatedTotal },
      ];
      const deductibleKdv: KdvByRate[] = [
        { rate: 20, taxableAmount: deductibleTotal * 5, taxAmount: deductibleTotal },
      ];

      const result = calculateKdv1Declaration({
        calculatedKdv,
        deductibleKdv,
        previousPeriodCarryOver: prevCarryOver,
        withholdingKdv: 0,
        exemptTransactions: 0,
        exportExemption: 0,
      });

      // Beyanname kaydını oluştur veya güncelle
      const periodParts = input.period.split("-");
      const year = parseInt(periodParts[0]!);
      const month = parseInt(periodParts[1]!);
      const periodStart = `${input.period}-01`;
      const periodEnd = new Date(year, month, 0).toISOString().split("T")[0]!;

      // KDV-1 son gün: takip eden ayın 28'i
      const dueDate = new Date(year, month, 28).toISOString().split("T")[0]!;

      const existing = await ctx.db.query.taxDeclarations.findFirst({
        where: and(
          eq(taxDeclarations.tenantId, tenantId),
          eq(taxDeclarations.declarationType, "kdv1"),
          eq(taxDeclarations.period, input.period)
        ),
      });

      const declarationData = {
        ...result,
        calculatedAt: new Date().toISOString(),
      };

      if (existing) {
        await ctx.db
          .update(taxDeclarations)
          .set({
            data: declarationData,
            taxableAmount: result.totalTaxableAmount.toString(),
            taxAmount: result.payableKdv.toString(),
            totalAmount: result.payableKdv.toString(),
            status: "calculated",
            updatedAt: new Date(),
          })
          .where(eq(taxDeclarations.id, existing.id));
        return { id: existing.id, ...result };
      }

      const [created] = await ctx.db
        .insert(taxDeclarations)
        .values({
          tenantId,
          declarationType: "kdv1",
          period: input.period,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          dueDate: new Date(dueDate),
          status: "calculated",
          data: declarationData,
          taxableAmount: result.totalTaxableAmount.toString(),
          taxAmount: result.payableKdv.toString(),
          totalAmount: result.payableKdv.toString(),
        })
        .returning();

      return { id: created!.id, ...result };
    }),

  /** Muhtasar Beyanname hesapla */
  calculateMuhtasar: accountantProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/),
        grossWages: z.number().min(0).default(0),
        freelancePayments: z.number().min(0).default(0),
        rentPayments: z.number().min(0).default(0),
        otherWithholdings: z.array(
          z.object({
            description: z.string(),
            grossAmount: z.number(),
            rate: z.number(),
          })
        ).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = calculateMuhtasar({
        grossWages: input.grossWages,
        freelancePayments: input.freelancePayments,
        rentPayments: input.rentPayments,
        otherWithholdings: input.otherWithholdings,
      });

      const periodParts = input.period.split("-");
      const year = parseInt(periodParts[0]!);
      const month = parseInt(periodParts[1]!);
      const periodStart = `${input.period}-01`;
      const periodEnd = new Date(year, month, 0).toISOString().split("T")[0]!;
      const dueDate = new Date(year, month, 26).toISOString().split("T")[0]!;

      const [created] = await ctx.db
        .insert(taxDeclarations)
        .values({
          tenantId: ctx.user.tenantId,
          declarationType: "muhtasar",
          period: input.period,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          dueDate: new Date(dueDate),
          status: "calculated",
          data: { ...result, calculatedAt: new Date().toISOString() },
          taxAmount: result.totalWithholding.toString(),
          totalAmount: result.totalWithholding.toString(),
        })
        .returning();

      return { id: created!.id, ...result };
    }),

  /** Geçici Vergi hesapla */
  calculateGeciciVergi: accountantProcedure
    .input(
      z.object({
        quarter: z.string().regex(/^\d{4}-Q[1-4]$/), // YYYY-Q1
        periodRevenue: z.number().min(0),
        periodExpense: z.number().min(0),
        previousPeriodTax: z.number().min(0).default(0),
        taxRate: z.number().min(0).max(100).default(25), // %25 Kurumlar
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = calculateGeciciVergi({
        periodRevenue: input.periodRevenue,
        periodExpense: input.periodExpense,
        previousPeriodTax: input.previousPeriodTax,
        taxRate: input.taxRate,
      });

      const [yearStr, qStr] = input.quarter.split("-");
      const year = parseInt(yearStr!);
      const q = parseInt(qStr!.replace("Q", ""));
      const periodStart = new Date(year, (q - 1) * 3, 1);
      const periodEnd = new Date(year, q * 3, 0);
      const dueDate = new Date(year, q * 3, 17); // Dönem bitiminden 17. gün

      const [created] = await ctx.db
        .insert(taxDeclarations)
        .values({
          tenantId: ctx.user.tenantId,
          declarationType: "gecici_vergi",
          period: input.quarter,
          periodStart,
          periodEnd,
          dueDate,
          status: "calculated",
          data: { ...result, calculatedAt: new Date().toISOString() },
          taxableAmount: result.periodProfit.toString(),
          taxAmount: result.payableTax.toString(),
          totalAmount: result.payableTax.toString(),
        })
        .returning();

      return { id: created!.id, ...result };
    }),

  /** Beyanname durumunu güncelle */
  updateStatus: accountantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["draft", "calculated", "validated", "submitted", "accepted", "revision_needed"]),
        submissionRef: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(taxDeclarations)
        .set({
          status: input.status,
          submissionDate: input.status === "submitted" ? new Date() : undefined,
          submissionRef: input.submissionRef,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(taxDeclarations.id, input.id),
            eq(taxDeclarations.tenantId, ctx.user.tenantId)
          )
        );
      return { success: true };
    }),

  /** Vergi takvimi (yaklaşan beyannameler) */
  calendar: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const upcoming = await ctx.db
      .select()
      .from(taxDeclarations)
      .where(eq(taxDeclarations.tenantId, ctx.user.tenantId))
      .orderBy(asc(taxDeclarations.dueDate))
      .limit(20);

    return upcoming;
  }),
});

function getPreviousMonth(period: string): string {
  const [yearStr, monthStr] = period.split("-");
  let year = parseInt(yearStr!);
  let month = parseInt(monthStr!) - 1;
  if (month === 0) {
    month = 12;
    year--;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

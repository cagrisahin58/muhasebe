import { z } from "zod";
import { router, protectedProcedure } from "./trpc.js";
import { eq, and, sql, desc, asc, gte, lte } from "drizzle-orm";
import {
  accounts,
  journalEntries,
  journalLines,
  invoices,
  contacts,
  bankAccounts,
  cashRegisters,
  checks,
  taxDeclarations,
} from "@finbooks/db";

export const dashboardRouter = router({
  /** Ana dashboard özet verileri */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // 1. Toplam alacak (120 Alıcılar) ve borç (320 Satıcılar) bakiyeleri
    const [receivable] = await ctx.db
      .select({
        total: sql<string>`COALESCE(SUM(${journalLines.debitAmount}::numeric - ${journalLines.creditAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`${accounts.code} LIKE '120%'`
        )
      );

    const [payable] = await ctx.db
      .select({
        total: sql<string>`COALESCE(SUM(${journalLines.creditAmount}::numeric - ${journalLines.debitAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`${accounts.code} LIKE '320%'`
        )
      );

    // 2. Kasa bakiyesi
    const kasaRegisters = await ctx.db
      .select({ balance: cashRegisters.currentBalance })
      .from(cashRegisters)
      .where(eq(cashRegisters.tenantId, tenantId));

    const totalCash = kasaRegisters.reduce((s, r) => s + parseFloat(r.balance), 0);

    // 3. Banka bakiyesi
    const bankAccts = await ctx.db
      .select({ balance: bankAccounts.currentBalance })
      .from(bankAccounts)
      .where(and(eq(bankAccounts.tenantId, tenantId), eq(bankAccounts.isActive, true)));

    const totalBank = bankAccts.reduce((s, a) => s + parseFloat(a.balance), 0);

    // 4. Toplam fiş sayısı (bu yıl)
    const [entryCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.tenantId, tenantId),
          gte(journalEntries.entryDate, yearStart.toISOString().split("T")[0]!)
        )
      );

    // 5. Fatura sayısı (bu yıl)
    const [invoiceCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          gte(invoices.invoiceDate, yearStart.toISOString().split("T")[0]!)
        )
      );

    // 6. Cari hesap sayısı
    const [contactCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(eq(contacts.tenantId, tenantId));

    return {
      totalReceivable: receivable?.total ?? "0",
      totalPayable: payable?.total ?? "0",
      totalCash: totalCash.toFixed(2),
      totalBank: totalBank.toFixed(2),
      totalLiquidity: (totalCash + totalBank).toFixed(2),
      entryCount: entryCount?.count ?? 0,
      invoiceCount: invoiceCount?.count ?? 0,
      contactCount: contactCount?.count ?? 0,
    };
  }),

  /** Aylık gelir/gider trend verileri (son 12 ay) */
  revenueExpenseTrend: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;

    // 6xx Gelir hesapları - aylık
    const revenueByMonth = await ctx.db
      .select({
        month: sql<string>`to_char(${journalEntries.entryDate}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${journalLines.creditAmount}::numeric - ${journalLines.debitAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`${accounts.code} LIKE '6%'`,
          gte(journalEntries.entryDate, sql`NOW() - INTERVAL '12 months'`)
        )
      )
      .groupBy(sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`);

    // 7xx Gider hesapları - aylık
    const expenseByMonth = await ctx.db
      .select({
        month: sql<string>`to_char(${journalEntries.entryDate}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${journalLines.debitAmount}::numeric - ${journalLines.creditAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`${accounts.code} LIKE '7%'`,
          gte(journalEntries.entryDate, sql`NOW() - INTERVAL '12 months'`)
        )
      )
      .groupBy(sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`);

    return { revenue: revenueByMonth, expense: expenseByMonth };
  }),

  /** KDV özet tablosu (aylık) */
  kdvSummary: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;

    const declarations = await ctx.db
      .select()
      .from(taxDeclarations)
      .where(
        and(
          eq(taxDeclarations.tenantId, tenantId),
          eq(taxDeclarations.declarationType, "kdv1")
        )
      )
      .orderBy(desc(taxDeclarations.period))
      .limit(12);

    return declarations.map((d) => ({
      period: d.period,
      taxableAmount: d.taxableAmount,
      taxAmount: d.taxAmount,
      totalAmount: d.totalAmount,
      status: d.status,
    }));
  }),

  /** Vadesi gelen alacak/borçlar */
  upcomingDues: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    // Vadesi yaklaşan faturalar
    const overdueInvoices = await ctx.db
      .select({
        id: invoices.id,
        invoiceNo: invoices.invoiceNo,
        contactName: contacts.name,
        type: invoices.type,
        grandTotal: invoices.grandTotal,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .leftJoin(contacts, eq(contacts.id, invoices.contactId))
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          sql`${invoices.status} NOT IN ('paid', 'cancelled')`,
          lte(invoices.dueDate, thirtyDaysLater.toISOString().split("T")[0]!)
        )
      )
      .orderBy(asc(invoices.dueDate))
      .limit(10);

    // Vadesi yaklaşan çek/senetler
    const upcomingChecks = await ctx.db
      .select({
        id: checks.id,
        serialNo: checks.serialNo,
        checkType: checks.checkType,
        amount: checks.amount,
        dueDate: checks.dueDate,
        contactName: contacts.name,
      })
      .from(checks)
      .leftJoin(contacts, eq(contacts.id, checks.contactId))
      .where(
        and(
          eq(checks.tenantId, tenantId),
          sql`${checks.status} IN ('portfolio', 'in_collection')`,
          lte(checks.dueDate, thirtyDaysLater.toISOString().split("T")[0]!)
        )
      )
      .orderBy(asc(checks.dueDate))
      .limit(10);

    return { overdueInvoices, upcomingChecks };
  }),

  /** Son işlemler */
  recentActivity: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.db
      .select({
        id: journalEntries.id,
        entryNo: journalEntries.entryNo,
        entryDate: journalEntries.entryDate,
        entryType: journalEntries.entryType,
        description: journalEntries.description,
        status: journalEntries.status,
      })
      .from(journalEntries)
      .where(eq(journalEntries.tenantId, ctx.user.tenantId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(10);

    return entries;
  }),

  /** Nakit akış verileri (son 6 ay) */
  cashFlow: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;

    // Kasa + Banka girişleri (100, 102 hesaplarındaki borç toplamları)
    const inflows = await ctx.db
      .select({
        month: sql<string>`to_char(${journalEntries.entryDate}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${journalLines.debitAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`(${accounts.code} LIKE '100%' OR ${accounts.code} LIKE '102%')`,
          gte(journalEntries.entryDate, sql`NOW() - INTERVAL '6 months'`)
        )
      )
      .groupBy(sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`);

    // Kasa + Banka çıkışları (100, 102 hesaplarındaki alacak toplamları)
    const outflows = await ctx.db
      .select({
        month: sql<string>`to_char(${journalEntries.entryDate}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${journalLines.creditAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`(${accounts.code} LIKE '100%' OR ${accounts.code} LIKE '102%')`,
          gte(journalEntries.entryDate, sql`NOW() - INTERVAL '6 months'`)
        )
      )
      .groupBy(sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`);

    return { inflows, outflows };
  }),

  /** Finansal oranlar */
  financialRatios: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;

    // Dönen varlıklar (1xx)
    const [currentAssets] = await ctx.db
      .select({
        total: sql<string>`COALESCE(SUM(${journalLines.debitAmount}::numeric - ${journalLines.creditAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`${accounts.code} LIKE '1%'`
        )
      );

    // Kısa vadeli yabancı kaynaklar (3xx)
    const [currentLiabilities] = await ctx.db
      .select({
        total: sql<string>`COALESCE(SUM(${journalLines.creditAmount}::numeric - ${journalLines.debitAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`${accounts.code} LIKE '3%'`
        )
      );

    // Toplam varlıklar (1xx + 2xx)
    const [totalAssets] = await ctx.db
      .select({
        total: sql<string>`COALESCE(SUM(${journalLines.debitAmount}::numeric - ${journalLines.creditAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`(${accounts.code} LIKE '1%' OR ${accounts.code} LIKE '2%')`
        )
      );

    // Özkaynaklar (5xx)
    const [equity] = await ctx.db
      .select({
        total: sql<string>`COALESCE(SUM(${journalLines.creditAmount}::numeric - ${journalLines.debitAmount}::numeric), 0)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, and(
        eq(journalLines.entryId, journalEntries.id),
        eq(journalEntries.status, "approved"),
      ))
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          sql`${accounts.code} LIKE '5%'`
        )
      );

    const ca = parseFloat(currentAssets?.total ?? "0");
    const cl = parseFloat(currentLiabilities?.total ?? "0");
    const ta = parseFloat(totalAssets?.total ?? "0");
    const eq_ = parseFloat(equity?.total ?? "0");

    // Cari oran = Dönen Varlıklar / KV Yabancı Kaynaklar
    const currentRatio = cl > 0 ? (ca / cl) : 0;
    // Borç/Özkaynak oranı
    const totalLiabilities = ta - eq_;
    const debtToEquity = eq_ > 0 ? (totalLiabilities / eq_) : 0;
    // Özkaynak kârlılığı (basit hesaplama)

    return {
      currentAssets: ca.toFixed(2),
      currentLiabilities: cl.toFixed(2),
      totalAssets: ta.toFixed(2),
      equity: eq_.toFixed(2),
      currentRatio: currentRatio.toFixed(2),
      debtToEquity: debtToEquity.toFixed(2),
    };
  }),
});

import { z } from "zod";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { eq, and, desc, asc } from "drizzle-orm";
import { bankAccounts, bankTransactions } from "@finbooks/db";
import { reconcileBankStatements, parseBankStatementCsv } from "../services/bank-reconciliation.js";

export const bankAccountsRouter = router({
  /** Banka hesapları listesi */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.tenantId, ctx.user.tenantId))
      .orderBy(asc(bankAccounts.bankName));
  }),

  /** Banka hesabı detay */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.query.bankAccounts.findFirst({
        where: and(
          eq(bankAccounts.id, input.id),
          eq(bankAccounts.tenantId, ctx.user.tenantId)
        ),
      });
      if (!account) throw new Error("Banka hesabı bulunamadı");
      return account;
    }),

  /** Banka hesabı oluştur */
  create: accountantProcedure
    .input(
      z.object({
        bankName: z.string().min(2).max(100),
        branchName: z.string().max(100).optional(),
        branchCode: z.string().max(20).optional(),
        accountNo: z.string().min(1).max(50),
        iban: z.string().max(34).optional(),
        currency: z.string().length(3).default("TRY"),
        accountType: z.enum(["checking", "savings", "credit"]).default("checking"),
        openingBalance: z.string().default("0"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [account] = await ctx.db
        .insert(bankAccounts)
        .values({
          tenantId: ctx.user.tenantId,
          bankName: input.bankName,
          branchName: input.branchName,
          branchCode: input.branchCode,
          accountNo: input.accountNo,
          iban: input.iban,
          currency: input.currency,
          accountType: input.accountType,
          currentBalance: input.openingBalance,
        })
        .returning();
      return account;
    }),

  /** Banka hesabı güncelle */
  update: accountantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        bankName: z.string().min(2).max(100).optional(),
        branchName: z.string().max(100).optional(),
        branchCode: z.string().max(20).optional(),
        iban: z.string().max(34).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await ctx.db
        .update(bankAccounts)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(bankAccounts.id, id), eq(bankAccounts.tenantId, ctx.user.tenantId))
        );
      return { success: true };
    }),

  /** Banka hareketleri listesi */
  transactions: protectedProcedure
    .input(
      z.object({
        bankAccountId: z.string().uuid(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(bankTransactions)
        .where(
          and(
            eq(bankTransactions.bankAccountId, input.bankAccountId),
            eq(bankTransactions.tenantId, ctx.user.tenantId)
          )
        )
        .orderBy(desc(bankTransactions.transactionDate))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /** Manuel banka hareketi ekle */
  addTransaction: accountantProcedure
    .input(
      z.object({
        bankAccountId: z.string().uuid(),
        transactionDate: z.string(),
        description: z.string().min(1),
        reference: z.string().optional(),
        amount: z.string(),
        transactionType: z.enum(["deposit", "withdrawal", "transfer", "fee", "interest"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [tx] = await ctx.db
        .insert(bankTransactions)
        .values({
          bankAccountId: input.bankAccountId,
          tenantId: ctx.user.tenantId,
          transactionDate: new Date(input.transactionDate),
          description: input.description,
          reference: input.reference,
          amount: input.amount,
          transactionType: input.transactionType,
          importSource: "manual",
        })
        .returning();

      // Bakiyeyi güncelle
      const amount = parseFloat(input.amount);
      const account = await ctx.db.query.bankAccounts.findFirst({
        where: eq(bankAccounts.id, input.bankAccountId),
      });
      if (account) {
        const newBalance = parseFloat(account.currentBalance) + amount;
        await ctx.db
          .update(bankAccounts)
          .set({ currentBalance: newBalance.toFixed(2), updatedAt: new Date() })
          .where(eq(bankAccounts.id, input.bankAccountId));
      }

      return tx;
    }),

  /** CSV ekstre import */
  importCsv: accountantProcedure
    .input(
      z.object({
        bankAccountId: z.string().uuid(),
        csvContent: z.string(),
        dateColumn: z.number(),
        descriptionColumn: z.number(),
        amountColumn: z.number(),
        referenceColumn: z.number().optional(),
        delimiter: z.string().default(";"),
        skipRows: z.number().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rows = parseBankStatementCsv(input.csvContent, {
        dateColumn: input.dateColumn,
        descriptionColumn: input.descriptionColumn,
        amountColumn: input.amountColumn,
        referenceColumn: input.referenceColumn,
        delimiter: input.delimiter,
        skipRows: input.skipRows,
      });

      if (rows.length === 0) throw new Error("CSV'den satır okunamadı");

      const batchId = `csv-${Date.now()}`;

      const values = rows.map((row) => ({
        bankAccountId: input.bankAccountId,
        tenantId: ctx.user.tenantId,
        transactionDate: new Date(row.date),
        description: row.description,
        reference: row.reference,
        amount: row.amount.toFixed(2),
        transactionType: row.amount >= 0 ? "deposit" as const : "withdrawal" as const,
        importSource: "csv" as const,
        importBatchId: batchId,
      }));

      await ctx.db.insert(bankTransactions).values(values);

      return { imported: rows.length, batchId };
    }),

  /** Otomatik mutabakat */
  reconcile: accountantProcedure
    .input(
      z.object({
        bankAccountId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Eşleştirilmemiş banka hareketlerini çek
      const unreconciledTx = await ctx.db
        .select()
        .from(bankTransactions)
        .where(
          and(
            eq(bankTransactions.bankAccountId, input.bankAccountId),
            eq(bankTransactions.tenantId, ctx.user.tenantId),
            eq(bankTransactions.isReconciled, false)
          )
        );

      const bankRows = unreconciledTx.map((tx) => ({
        id: tx.id,
        date: tx.transactionDate.toISOString().split("T")[0]!,
        description: tx.description,
        reference: tx.reference ?? undefined,
        amount: parseFloat(tx.amount),
      }));

      // Basit sonuç döndür (gerçek journal eşleştirmesi için daha kapsamlı sorgu gerekir)
      const result = reconcileBankStatements(bankRows, []);

      return {
        total: unreconciledTx.length,
        matched: result.matched.length,
        unmatched: result.unmatchedBank.length,
        matchRate: result.matchRate,
      };
    }),
});

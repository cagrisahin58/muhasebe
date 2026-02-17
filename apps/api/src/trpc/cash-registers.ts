import { z } from "zod";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { eq, and, desc, asc } from "drizzle-orm";
import { cashRegisters, cashTransactions, contacts } from "@finbooks/db";

export const cashRegistersRouter = router({
  /** Kasa listesi */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.tenantId, ctx.user.tenantId))
      .orderBy(asc(cashRegisters.name));
  }),

  /** Kasa oluştur */
  create: accountantProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        currency: z.string().length(3).default("TRY"),
        openingBalance: z.string().default("0"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [register] = await ctx.db
        .insert(cashRegisters)
        .values({
          tenantId: ctx.user.tenantId,
          name: input.name,
          currency: input.currency,
          currentBalance: input.openingBalance,
        })
        .returning();
      return register;
    }),

  /** Kasa güncelle */
  update: accountantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await ctx.db
        .update(cashRegisters)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(cashRegisters.id, id), eq(cashRegisters.tenantId, ctx.user.tenantId))
        );
      return { success: true };
    }),

  /** Kasa hareketleri */
  transactions: protectedProcedure
    .input(
      z.object({
        cashRegisterId: z.string().uuid(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          transaction: cashTransactions,
          contactName: contacts.name,
        })
        .from(cashTransactions)
        .leftJoin(contacts, eq(contacts.id, cashTransactions.contactId))
        .where(
          and(
            eq(cashTransactions.cashRegisterId, input.cashRegisterId),
            eq(cashTransactions.tenantId, ctx.user.tenantId)
          )
        )
        .orderBy(desc(cashTransactions.transactionDate))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /** Kasa hareketi ekle */
  addTransaction: accountantProcedure
    .input(
      z.object({
        cashRegisterId: z.string().uuid(),
        transactionDate: z.string(),
        transactionType: z.enum(["income", "expense", "transfer"]),
        description: z.string().min(1),
        amount: z.string(),
        contactId: z.string().uuid().optional(),
        reference: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [tx] = await ctx.db
        .insert(cashTransactions)
        .values({
          cashRegisterId: input.cashRegisterId,
          tenantId: ctx.user.tenantId,
          transactionDate: new Date(input.transactionDate),
          transactionType: input.transactionType,
          description: input.description,
          amount: input.amount,
          contactId: input.contactId,
          reference: input.reference,
        })
        .returning();

      // Kasa bakiyesini güncelle
      const amount = parseFloat(input.amount);
      const sign = input.transactionType === "expense" ? -1 : 1;
      const register = await ctx.db.query.cashRegisters.findFirst({
        where: eq(cashRegisters.id, input.cashRegisterId),
      });

      if (register) {
        const newBalance = parseFloat(register.currentBalance) + (amount * sign);
        await ctx.db
          .update(cashRegisters)
          .set({ currentBalance: newBalance.toFixed(2), updatedAt: new Date() })
          .where(eq(cashRegisters.id, input.cashRegisterId));
      }

      return tx;
    }),

  /** Kasa özeti */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const registers = await ctx.db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.tenantId, ctx.user.tenantId));

    const totalBalance = registers.reduce(
      (sum, r) => sum + parseFloat(r.currentBalance),
      0
    );

    return {
      registers: registers.map((r) => ({
        id: r.id,
        name: r.name,
        currency: r.currency,
        balance: r.currentBalance,
      })),
      totalBalance: totalBalance.toFixed(2),
    };
  }),
});

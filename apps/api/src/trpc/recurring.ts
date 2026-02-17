import { z } from "zod";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { eq, and, desc, asc, lte } from "drizzle-orm";
import { recurringTemplates } from "@finbooks/db";

export const recurringRouter = router({
  /** Şablon listesi */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(recurringTemplates)
      .where(eq(recurringTemplates.tenantId, ctx.user.tenantId))
      .orderBy(asc(recurringTemplates.nextRunDate));
  }),

  /** Şablon detay */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.query.recurringTemplates.findFirst({
        where: and(
          eq(recurringTemplates.id, input.id),
          eq(recurringTemplates.tenantId, ctx.user.tenantId)
        ),
      });
      if (!template) throw new Error("Şablon bulunamadı");
      return template;
    }),

  /** Şablon oluştur */
  create: accountantProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
        dayOfMonth: z.number().min(1).max(31).optional(),
        nextRunDate: z.string(),
        endDate: z.string().optional(),
        entryType: z.enum(["mahsup", "tahsil", "tediye"]),
        lines: z.array(
          z.object({
            accountId: z.string().uuid(),
            debitAmount: z.string().default("0"),
            creditAmount: z.string().default("0"),
            description: z.string().optional(),
          })
        ).min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .insert(recurringTemplates)
        .values({
          tenantId: ctx.user.tenantId,
          name: input.name,
          description: input.description,
          frequency: input.frequency,
          dayOfMonth: input.dayOfMonth,
          nextRunDate: new Date(input.nextRunDate),
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          entryType: input.entryType,
          lines: input.lines,
          createdBy: ctx.user.id,
        })
        .returning();
      return template;
    }),

  /** Şablon güncelle */
  update: accountantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        nextRunDate: z.string().optional(),
        endDate: z.string().optional(),
        lines: z.array(
          z.object({
            accountId: z.string().uuid(),
            debitAmount: z.string().default("0"),
            creditAmount: z.string().default("0"),
            description: z.string().optional(),
          })
        ).min(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.nextRunDate) updateData.nextRunDate = new Date(data.nextRunDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);
      if (data.lines) updateData.lines = data.lines;

      await ctx.db
        .update(recurringTemplates)
        .set(updateData)
        .where(
          and(
            eq(recurringTemplates.id, id),
            eq(recurringTemplates.tenantId, ctx.user.tenantId)
          )
        );
      return { success: true };
    }),

  /** Şablon sil */
  delete: accountantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(recurringTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(recurringTemplates.id, input.id),
            eq(recurringTemplates.tenantId, ctx.user.tenantId)
          )
        );
      return { success: true };
    }),

  /** Çalıştırılması gereken şablonlar */
  pending: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    return ctx.db
      .select()
      .from(recurringTemplates)
      .where(
        and(
          eq(recurringTemplates.tenantId, ctx.user.tenantId),
          eq(recurringTemplates.isActive, true),
          lte(recurringTemplates.nextRunDate, today.toISOString().split("T")[0]!)
        )
      )
      .orderBy(asc(recurringTemplates.nextRunDate));
  }),
});

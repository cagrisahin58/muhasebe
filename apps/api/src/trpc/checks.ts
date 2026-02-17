import { z } from "zod";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { eq, and, desc, asc, lte, gte } from "drizzle-orm";
import { checks, contacts } from "@finbooks/db";

export const checksRouter = router({
  /** Çek/Senet listesi */
  list: protectedProcedure
    .input(
      z.object({
        checkType: z.enum(["received_check", "given_check", "received_note", "given_note"]).optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          check: checks,
          contactName: contacts.name,
        })
        .from(checks)
        .leftJoin(contacts, eq(contacts.id, checks.contactId))
        .where(eq(checks.tenantId, ctx.user.tenantId))
        .orderBy(asc(checks.dueDate))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /** Çek/Senet detay */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const check = await ctx.db
        .select({
          check: checks,
          contactName: contacts.name,
        })
        .from(checks)
        .leftJoin(contacts, eq(contacts.id, checks.contactId))
        .where(and(eq(checks.id, input.id), eq(checks.tenantId, ctx.user.tenantId)))
        .limit(1);

      if (!check[0]) throw new Error("Çek/Senet bulunamadı");
      return check[0];
    }),

  /** Çek/Senet kaydet */
  create: accountantProcedure
    .input(
      z.object({
        checkType: z.enum(["received_check", "given_check", "received_note", "given_note"]),
        serialNo: z.string().min(1).max(50),
        contactId: z.string().uuid(),
        bankName: z.string().max(100).optional(),
        branchName: z.string().max(100).optional(),
        accountNo: z.string().max(50).optional(),
        amount: z.string(),
        currency: z.string().length(3).default("TRY"),
        issueDate: z.string(),
        dueDate: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [check] = await ctx.db
        .insert(checks)
        .values({
          tenantId: ctx.user.tenantId,
          checkType: input.checkType,
          serialNo: input.serialNo,
          contactId: input.contactId,
          bankName: input.bankName,
          branchName: input.branchName,
          accountNo: input.accountNo,
          amount: input.amount,
          currency: input.currency,
          issueDate: new Date(input.issueDate),
          dueDate: new Date(input.dueDate),
          status: "portfolio",
          notes: input.notes,
        })
        .returning();
      return check;
    }),

  /** Çek/Senet durumunu güncelle */
  updateStatus: accountantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum([
          "portfolio", "in_collection", "collected", "endorsed",
          "bounced", "paid", "cancelled",
        ]),
        endorsedToId: z.string().uuid().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.status === "endorsed" && input.endorsedToId) {
        updateData.endorsedTo = input.endorsedToId;
        updateData.endorsedDate = new Date();
      }
      if (input.status === "collected") {
        updateData.collectionDate = new Date();
      }
      if (input.status === "bounced") {
        updateData.bouncedDate = new Date();
      }
      if (input.notes) {
        updateData.notes = input.notes;
      }

      await ctx.db
        .update(checks)
        .set(updateData)
        .where(
          and(eq(checks.id, input.id), eq(checks.tenantId, ctx.user.tenantId))
        );
      return { success: true };
    }),

  /** Vadesi yaklaşan çek/senetler */
  upcoming: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + input.days);

      return ctx.db
        .select({
          check: checks,
          contactName: contacts.name,
        })
        .from(checks)
        .leftJoin(contacts, eq(contacts.id, checks.contactId))
        .where(
          and(
            eq(checks.tenantId, ctx.user.tenantId),
            gte(checks.dueDate, today.toISOString().split("T")[0]!),
            lte(checks.dueDate, futureDate.toISOString().split("T")[0]!)
          )
        )
        .orderBy(asc(checks.dueDate));
    }),

  /** Portföy özeti */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const allChecks = await ctx.db
      .select()
      .from(checks)
      .where(eq(checks.tenantId, ctx.user.tenantId));

    const summary = {
      receivedChecks: { count: 0, total: 0 },
      givenChecks: { count: 0, total: 0 },
      receivedNotes: { count: 0, total: 0 },
      givenNotes: { count: 0, total: 0 },
      byStatus: {} as Record<string, { count: number; total: number }>,
    };

    for (const check of allChecks) {
      const amount = parseFloat(check.amount);
      const key = check.checkType === "received_check" ? "receivedChecks"
        : check.checkType === "given_check" ? "givenChecks"
        : check.checkType === "received_note" ? "receivedNotes"
        : "givenNotes";

      summary[key].count++;
      summary[key].total += amount;

      if (!summary.byStatus[check.status]) {
        summary.byStatus[check.status] = { count: 0, total: 0 };
      }
      summary.byStatus[check.status]!.count++;
      summary.byStatus[check.status]!.total += amount;
    }

    return summary;
  }),
});

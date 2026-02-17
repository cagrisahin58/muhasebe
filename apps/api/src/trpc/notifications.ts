import { z } from "zod";
import { router, protectedProcedure } from "./trpc.js";
import { eq, and, desc } from "drizzle-orm";
import { notifications } from "@finbooks/db";

export const notificationsRouter = router({
  /** Bildirim listesi */
  list: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return query;
    }),

  /** Okunmamış bildirim sayısı */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const all = await ctx.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );
    return { count: all.length };
  }),

  /** Bildirimi okundu olarak işaretle */
  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  /** Tümünü okundu işaretle */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );
    return { success: true };
  }),
});

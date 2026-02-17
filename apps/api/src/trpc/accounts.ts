import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, like, asc, isNull } from "drizzle-orm";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { accounts } from "@finbooks/db";
import { createAccountSchema, updateAccountSchema } from "@finbooks/shared";
import { createAuditLog } from "../middleware/audit.js";

export const accountsRouter = router({
  /** Hesap planı ağaç yapısı */
  getTree: protectedProcedure.query(async ({ ctx }) => {
    const allAccounts = await ctx.db
      .select()
      .from(accounts)
      .where(
        and(eq(accounts.tenantId, ctx.user.tenantId), eq(accounts.isActive, true))
      )
      .orderBy(asc(accounts.code));

    return allAccounts;
  }),

  /** Hesap listesi (düz liste, filtrelenebilir) */
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        level: z.number().int().min(1).max(5).optional(),
        type: z.string().optional(),
        parentId: z.string().uuid().nullable().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.db
        .select()
        .from(accounts)
        .where(eq(accounts.tenantId, ctx.user.tenantId))
        .orderBy(asc(accounts.code));

      const results = await query;

      let filtered = results;

      if (input?.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(
          (a) => a.code.toLowerCase().includes(s) || a.name.toLowerCase().includes(s)
        );
      }
      if (input?.level) {
        filtered = filtered.filter((a) => a.level === input.level);
      }
      if (input?.type) {
        filtered = filtered.filter((a) => a.type === input.type);
      }

      return filtered;
    }),

  /** Tek hesap detayı */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.query.accounts.findFirst({
        where: and(eq(accounts.id, input.id), eq(accounts.tenantId, ctx.user.tenantId)),
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
      }

      return account;
    }),

  /** Yeni hesap oluştur */
  create: accountantProcedure
    .input(createAccountSchema)
    .mutation(async ({ ctx, input }) => {
      // Aynı kodla hesap var mı?
      const existing = await ctx.db.query.accounts.findFirst({
        where: and(
          eq(accounts.tenantId, ctx.user.tenantId),
          eq(accounts.code, input.code)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${input.code} kodlu hesap zaten mevcut`,
        });
      }

      // Seviye hesapla
      const dotCount = (input.code.match(/\./g) || []).length;
      const level = input.code.replace(/\./g, "").length <= 1
        ? 1
        : input.code.replace(/\./g, "").length <= 2
          ? 2
          : input.code.replace(/\./g, "").length <= 3
            ? 3
            : 4;

      const [account] = await ctx.db
        .insert(accounts)
        .values({
          tenantId: ctx.user.tenantId,
          code: input.code,
          name: input.name,
          parentId: input.parentId ?? null,
          type: input.type,
          level,
          isSystem: false,
          isActive: true,
        })
        .returning();

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "create",
        entityType: "account",
        entityId: account!.id,
        newValues: { code: input.code, name: input.name },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return account;
    }),

  /** Hesap güncelle */
  update: accountantProcedure
    .input(z.object({ id: z.string().uuid(), data: updateAccountSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.accounts.findFirst({
        where: and(eq(accounts.id, input.id), eq(accounts.tenantId, ctx.user.tenantId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hesap bulunamadı" });
      }

      if (existing.isSystem && input.data.isActive === false) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sistem hesapları devre dışı bırakılamaz",
        });
      }

      const [updated] = await ctx.db
        .update(accounts)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(accounts.id, input.id))
        .returning();

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "update",
        entityType: "account",
        entityId: input.id,
        oldValues: { name: existing.name, isActive: existing.isActive },
        newValues: input.data,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return updated;
    }),
});

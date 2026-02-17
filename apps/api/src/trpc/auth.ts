import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { hash, verify } from "argon2";
import { router, publicProcedure, protectedProcedure } from "./trpc.js";
import { users, tenants } from "@finbooks/db";
import { loginSchema, registerSchema, createTenantSchema } from "@finbooks/shared";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  invalidateToken,
  type JwtPayload,
} from "../middleware/auth.js";
import { createAuditLog } from "../middleware/audit.js";
import { redis } from "../config/redis.js";

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

export const authRouter = router({
  /** Giriş */
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    // Rate limiting kontrolü
    const rateLimitKey = `login_attempts:${ctx.ip}:${input.email}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) {
      await redis.expire(rateLimitKey, 15 * 60); // 15dk
    }
    if (attempts > 5) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin.",
      });
    }

    // Kullanıcıyı bul
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (!user || !user.isActive) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "E-posta veya şifre hatalı" });
    }

    // Şifre doğrula
    const validPassword = await verify(user.passwordHash, input.password);
    if (!validPassword) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "E-posta veya şifre hatalı" });
    }

    // Rate limit sıfırla
    await redis.del(rateLimitKey);

    // Token üret
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role as JwtPayload["role"],
    };

    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    // Son giriş tarihini güncelle
    await ctx.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Audit log
    await createAuditLog({
      db: ctx.db,
      user: payload,
      action: "login",
      entityType: "user",
      entityId: user.id,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }),

  /** Kayıt + Yeni Firma */
  register: publicProcedure
    .input(
      z.object({
        user: registerSchema,
        tenant: createTenantSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Email kontrolü
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.user.email),
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Bu e-posta adresi zaten kayıtlı" });
      }

      // Şifre hash'le
      const passwordHash = await hash(input.user.password, ARGON2_OPTIONS);

      // Firma oluştur
      const [tenant] = await ctx.db
        .insert(tenants)
        .values(input.tenant)
        .returning();

      // Admin kullanıcı oluştur
      const [user] = await ctx.db
        .insert(users)
        .values({
          tenantId: tenant!.id,
          email: input.user.email,
          name: input.user.name,
          passwordHash,
          role: "admin",
          isActive: true,
        })
        .returning();

      const payload: JwtPayload = {
        sub: user!.id,
        tenantId: tenant!.id,
        email: user!.email,
        role: "admin",
      };

      const accessToken = await generateAccessToken(payload);
      const refreshToken = await generateRefreshToken(payload);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
          role: user!.role,
          tenantId: tenant!.id,
        },
      };
    }),

  /** Token yenile */
  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { sub } = await verifyRefreshToken(input.refreshToken);

      // Redis'teki token ile karşılaştır
      const storedToken = await redis.get(`refresh:${sub}`);
      if (storedToken !== input.refreshToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Geçersiz refresh token" });
      }

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, sub),
      });

      if (!user || !user.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Kullanıcı bulunamadı" });
      }

      const payload: JwtPayload = {
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role as JwtPayload["role"],
      };

      const accessToken = await generateAccessToken(payload);
      const refreshToken = await generateRefreshToken(payload);

      return { accessToken, refreshToken };
    }),

  /** Çıkış */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await invalidateToken("current", ctx.user.sub);

    await createAuditLog({
      db: ctx.db,
      user: ctx.user,
      action: "logout",
      entityType: "user",
      entityId: ctx.user.sub,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { success: true };
  }),

  /** Mevcut kullanıcı bilgisi */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.sub),
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Kullanıcı bulunamadı" });
    }

    const tenant = await ctx.db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenant: tenant
        ? { id: tenant.id, name: tenant.name, taxId: tenant.taxId }
        : null,
    };
  }),
});

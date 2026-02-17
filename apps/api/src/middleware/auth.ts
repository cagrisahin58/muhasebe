import { FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify, SignJWT } from "jose";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import type { UserRole } from "@finbooks/shared";

export interface JwtPayload {
  sub: string; // user id
  tenantId: string;
  email: string;
  role: UserRole;
}

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export async function generateAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRY)
    .sign(accessSecret);
}

export async function generateRefreshToken(payload: JwtPayload): Promise<string> {
  const token = await new SignJWT({ sub: payload.sub })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRY)
    .sign(refreshSecret);

  // Redis'te sakla (7 gün TTL)
  await redis.set(`refresh:${payload.sub}`, token, "EX", 7 * 24 * 60 * 60);
  return token;
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload as unknown as { sub: string };
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    const cookieToken = (request.cookies as Record<string, string | undefined>)?.["access_token"];
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : cookieToken;

    if (!token) {
      return reply.status(401).send({ success: false, message: "Yetkilendirme gerekli" });
    }

    // Blacklist kontrolü
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return reply.status(401).send({ success: false, message: "Token geçersiz" });
    }

    const payload = await verifyAccessToken(token);
    (request as any).user = payload;
  } catch {
    return reply.status(401).send({ success: false, message: "Geçersiz veya süresi dolmuş token" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JwtPayload | undefined;
    if (!user) {
      return reply.status(401).send({ success: false, message: "Yetkilendirme gerekli" });
    }
    if (!roles.includes(user.role)) {
      return reply.status(403).send({ success: false, message: "Bu işlem için yetkiniz yok" });
    }
  };
}

export async function invalidateToken(token: string, userId: string) {
  // Access token blacklist (15dk TTL)
  await redis.set(`blacklist:${token}`, "1", "EX", 15 * 60);
  // Refresh token sil
  await redis.del(`refresh:${userId}`);
}

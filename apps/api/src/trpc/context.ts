import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { db } from "../config/db.js";
import { verifyAccessToken, type JwtPayload } from "../middleware/auth.js";
import { redis } from "../config/redis.js";

export async function createContext({ req }: CreateFastifyContextOptions) {
  let user: JwtPayload | null = null;

  try {
    const authHeader = req.headers.authorization;
    const cookieToken = (req.cookies as Record<string, string | undefined>)?.["access_token"];
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : cookieToken;

    if (token) {
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (!isBlacklisted) {
        user = await verifyAccessToken(token);
      }
    }
  } catch {
    // Token invalid - user stays null
  }

  return {
    db,
    user,
    redis,
    ip: req.ip,
    userAgent: req.headers["user-agent"] ?? "",
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

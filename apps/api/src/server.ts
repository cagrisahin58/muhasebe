import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter } from "./trpc/router.js";
import { createContext } from "./trpc/context.js";
import { env } from "./config/env.js";
import { redis } from "./config/redis.js";

async function buildServer() {
  const server = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
    trustProxy: true,
  });

  // Plugins
  await server.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production",
    crossOriginEmbedderPolicy: false,
  });

  await server.register(cors, {
    origin: env.APP_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  });

  await server.register(cookie, {
    secret: env.JWT_SECRET,
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // tRPC
  await server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  });

  // Health check
  server.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  return server;
}

async function start() {
  try {
    // Redis'e bağlan
    await redis.connect();

    const server = await buildServer();

    await server.listen({
      host: env.HOST,
      port: env.PORT,
    });

    console.log(`🚀 FinBooks API çalışıyor: http://${env.HOST}:${env.PORT}`);
    console.log(`   tRPC endpoint: http://${env.HOST}:${env.PORT}/trpc`);
    console.log(`   Health check: http://${env.HOST}:${env.PORT}/health`);
  } catch (err) {
    console.error("Sunucu başlatma hatası:", err);
    process.exit(1);
  }
}

start();

export { buildServer };

import Redis from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("Redis bağlantı hatası:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis bağlandı");
});

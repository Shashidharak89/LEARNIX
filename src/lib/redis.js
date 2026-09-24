import Redis from "ioredis";

let redis = null;

if (process.env.REDIS_URL) {
  try {
    if (!global._redisClient) {
      global._redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        enableOfflineQueue: false,
        retryStrategy(times) {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 100, 2000);
        },
      });

      global._redisClient.on("error", (err) => {
        console.error("[Redis Error]:", err.message);
      });
    }
    redis = global._redisClient;
  } catch (err) {
    console.error("[Redis Initialization Error]:", err);
  }
} else {
  console.warn("[Redis] REDIS_URL is not configured in environment variables.");
}

/**
 * Helper to delete Redis keys matching a pattern.
 */
export async function invalidateUpdatesCache() {
  if (!redis) return;
  try {
    const keys = await redis.keys("updates:*");
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error("[Redis Invalidation Error]:", err.message);
  }
}

export default redis;

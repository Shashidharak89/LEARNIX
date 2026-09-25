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
            return null; // Stop retrying after 3 attempts
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
    console.error("[Redis Initialization Error]: Fallback active -", err.message);
  }
} else {
  console.warn("[Redis Warning]: REDIS_URL is not set in environment variables. Falling back to DB only.");
}

/**
 * Helper to delete all Redis keys matching "updates:*".
 * Logs invalidation details and handles failures gracefully.
 */
export async function invalidateUpdatesCache() {
  if (!redis) {
    console.log("[Redis Cache INVALIDATION Skipped]: Redis client not connected.");
    return;
  }
  try {
    const keys = await redis.keys("updates:*");
    if (keys && keys.length > 0) {
      await redis.del(keys);
      console.log(`[Redis Cache INVALIDATED] Successfully cleared ${keys.length} update cache key(s):`, keys);
    } else {
      console.log("[Redis Cache INVALIDATION] No active 'updates:*' cache keys found to clear.");
    }
  } catch (err) {
    console.error("[Redis Cache INVALIDATION Error]: Fallback active -", err.message);
  }
}

export default redis;

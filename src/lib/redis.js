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

export default redis;

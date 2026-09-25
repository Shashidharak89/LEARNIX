import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import User from "@/models/User";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 300;

export async function GET() {
  try {
    const cacheKey = `updates:preview`;

    if (redis) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          console.log(`[Redis Cache HIT] Key: "${cacheKey}"`);
          return NextResponse.json(JSON.parse(cachedData), {
            status: 200,
            headers: {
              "X-Cache": "HIT",
              "Cache-Control": "public, max-age=300, s-maxage=300",
            },
          });
        }
        console.log(`[Redis Cache MISS] Key: "${cacheKey}"`);
      } catch (cacheError) {
        console.warn("[Redis Cache Read Error]: Fallback active -", cacheError.message);
      }
    }

    await connectDB();

    const updates = await Update.find({
      $or: [
        { visibility: "public" },
        { visibility: "unlisted" },
        { visibility: { $exists: false } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const userIds = updates.map((update) => update.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const enriched = updates.map((update) => {
      const userKey = update.userId ? update.userId.toString() : null;
      const user = userKey ? userMap[userKey] : null;

      return {
        _id: update._id,
        title: update.title,
        content: update.content,
        links: update.links || [],
        files: update.files || [],
        visibility: update.visibility || "public",
        createdAt: update.createdAt,
        userId: update.userId || null,
        name: user?.name || null,
        usn: user?.usn || null,
      };
    });

    const responseData = { updates: enriched };

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", CACHE_TTL_SECONDS);
        console.log(`[Redis Cache STORED] Key: "${cacheKey}" (TTL: 300s)`);
      } catch (cacheSetErr) {
        console.warn("[Redis Cache Write Error]: Fallback active -", cacheSetErr.message);
      }
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("GET /api/updates/preview error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

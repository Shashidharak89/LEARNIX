import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import User from "@/models/User";
import redis from "@/lib/redis";

const CACHE_TTL_SECONDS = 300;

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const searchParamsString = url.searchParams.toString() || 'default';
    const cacheKey = `updates:latest:${searchParamsString}`;

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

    const indexParam = url.searchParams.get('index') || '1';
    const userId = (url.searchParams.get('userId') || '').trim();
    const pageIndex = Math.max(1, parseInt(indexParam, 10) || 1);
    const pageSize = 10;
    const skip = (pageIndex - 1) * pageSize;

    const currentUserId = (url.searchParams.get('currentUserId') || '').trim();
    const query = {};
    if (userId) {
      query.userId = userId;
      if (currentUserId !== userId) {
        query.$or = [
          { visibility: "public" },
          { visibility: "unlisted" },
          { visibility: { $exists: false } }
        ];
      }
    } else {
      query.$or = [
        { visibility: "public" },
        { visibility: "unlisted" },
        { visibility: { $exists: false } }
      ];
    }

    const updates = await Update.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const userIds = updates.map(u => u.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const enriched = updates.map(u => {
      const uid = u.userId ? u.userId.toString() : null;
      const user = uid ? userMap[uid] : null;
      return {
        _id: u._id,
        title: u.title,
        content: u.content,
        links: u.links || [],
        files: u.files || [],
        userId: u.userId,
        visibility: u.visibility || "public",
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        usn: user?.usn || null,
        name: user?.name || null,
        profileUrl: user?.profileimg || null,
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
    console.error('GET /api/updates/latest error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectParam = searchParams.get("subject") || searchParams.get("name");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    if (!subjectParam || !subjectParam.trim()) {
      return NextResponse.json(
        { error: "subject parameter is required" },
        { status: 400 }
      );
    }

    const subjectName = subjectParam.trim();
    const cacheKey = `suggestions:topics:${encodeURIComponent(subjectName.toLowerCase())}:page:${page}:limit:${limit}`;

    // Try Redis cache first
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return NextResponse.json(JSON.parse(cached), {
            headers: {
              "X-Cache": "HIT",
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
          });
        }
      } catch (redisErr) {
        console.warn("[Redis Suggestions Topics Get Error]:", redisErr.message);
      }
    }

    await connectDB();

    // Exact match for subject name (case-insensitive exact match)
    const escaped = subjectName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const subjects = await Subject.find(
      {
        subject: { $regex: new RegExp(`^${escaped}$`, "i") },
        $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
      },
      { _id: 1 }
    ).lean();

    const subjectIds = subjects.map((s) => s._id);

    if (subjectIds.length === 0) {
      const emptyPayload = {
        subject: subjectName,
        topics: [],
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasMore: false,
      };

      if (redis) {
        try {
          await redis.set(cacheKey, JSON.stringify(emptyPayload), "EX", 300);
        } catch (_) {}
      }

      return NextResponse.json(emptyPayload, {
        headers: { "X-Cache": "MISS" },
      });
    }

    const topicPipeline = [
      {
        $match: {
          subjectId: { $in: subjectIds },
          $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
          topic: { $exists: true, $nin: ["", null] },
        },
      },
      {
        $group: {
          _id: "$topic",
          latestTimestamp: { $max: "$timestamp" },
        },
      },
      {
        $sort: {
          latestTimestamp: -1,
          _id: 1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const results = await Topic.aggregate(topicPipeline);
    const total = results[0]?.metadata[0]?.total || 0;
    const rawData = results[0]?.data || [];

    const topics = rawData.map((d) => d._id);
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    const responsePayload = {
      subject: subjectName,
      topics,
      page,
      limit,
      total,
      totalPages,
      hasMore,
    };

    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 600);
      } catch (redisSetErr) {
        console.warn("[Redis Suggestions Topics Set Error]:", redisSetErr.message);
      }
    }

    return NextResponse.json(responsePayload, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error in /api/resources/suggestions/topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics suggestions", details: error.message },
      { status: 500 }
    );
  }
}

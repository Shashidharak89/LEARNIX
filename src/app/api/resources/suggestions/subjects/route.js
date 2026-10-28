import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const cacheKey = `suggestions:subjects:page:${page}:limit:${limit}`;

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
        console.warn("[Redis Suggestions Subjects Get Error]:", redisErr.message);
      }
    }

    await connectDB();

    const pipeline = [
      {
        $match: {
          $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
          subject: { $exists: true, $nin: ["", null] },
        },
      },
      {
        $group: {
          _id: "$subject",
          latestCreated: { $max: "$createdAt" },
          subjectIds: { $push: "$_id" },
        },
      },
      {
        $lookup: {
          from: "topics",
          let: { ids: "$subjectIds" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$subjectId", "$$ids"] },
                $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
              },
            },
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
            { $project: { timestamp: 1 } },
          ],
          as: "recentTopic",
        },
      },
      {
        $addFields: {
          latestActivity: {
            $max: [
              "$latestCreated",
              { $arrayElemAt: ["$recentTopic.timestamp", 0] },
            ],
          },
        },
      },
      {
        $sort: {
          latestActivity: -1,
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

    const results = await Subject.aggregate(pipeline);
    const total = results[0]?.metadata[0]?.total || 0;
    const rawData = results[0]?.data || [];

    const subjects = rawData.map((item) => ({
      name: item._id,
      latestActivity: item.latestActivity,
    }));

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    const responsePayload = {
      subjects,
      page,
      limit,
      total,
      totalPages,
      hasMore,
    };

    // Store in Redis cache for 10 minutes (600s)
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 600);
      } catch (redisSetErr) {
        console.warn("[Redis Suggestions Subjects Set Error]:", redisSetErr.message);
      }
    }

    return NextResponse.json(responsePayload, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error in /api/resources/suggestions/subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects suggestions", details: error.message },
      { status: 500 }
    );
  }
}

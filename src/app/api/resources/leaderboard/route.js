import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import User from "@/models/User";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/**
 * GET /api/resources/leaderboard?range=7d|30d|90d|all|custom&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Computes leaderboard based on number of uploaded topics.
 * Tie-breaker: total number of images uploaded.
 * Returns up to top 10 users with rank, user details, topicCount, imageCount.
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") || "7d").toLowerCase();
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let startDate = null;
    let endDate = null;
    const now = new Date();

    if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "90d") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === "custom") {
      if (fromParam) {
        startDate = new Date(fromParam);
        startDate.setHours(0, 0, 0, 0);
      }
      if (toParam) {
        endDate = new Date(toParam);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (range === "all") {
      startDate = null;
    } else {
      // Default fallback: 7 days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build match criteria for topics
    const matchConditions = {
      $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
    };

    if (startDate || endDate) {
      matchConditions.timestamp = {};
      if (startDate && !isNaN(startDate.getTime())) {
        matchConditions.timestamp.$gte = startDate;
      }
      if (endDate && !isNaN(endDate.getTime())) {
        matchConditions.timestamp.$lte = endDate;
      }
      if (Object.keys(matchConditions.timestamp).length === 0) {
        delete matchConditions.timestamp;
      }
    }

    const pipeline = [
      { $match: matchConditions },
      {
        $group: {
          _id: "$userId",
          topicCount: { $sum: 1 },
          imageCount: {
            $sum: {
              $cond: {
                if: { $isArray: "$images" },
                then: { $size: "$images" },
                else: 0,
              },
            },
          },
          lastUpload: { $max: "$timestamp" },
        },
      },
      // Sort primarily by topicCount desc, then imageCount desc, then lastUpload desc
      {
        $sort: {
          topicCount: -1,
          imageCount: -1,
          lastUpload: -1,
        },
      },
      { $limit: 10 },
      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 1,
          userId: "$_id",
          topicCount: 1,
          imageCount: 1,
          name: "$userInfo.name",
          usn: "$userInfo.usn",
          profileimg: "$userInfo.profileimg",
          role: "$userInfo.role",
        },
      },
    ];

    const results = await Topic.aggregate(pipeline);

    const leaderboard = results.map((item, index) => ({
      rank: index + 1,
      userId: item.userId,
      name: item.name || "Anonymous",
      usn: item.usn || "",
      profileimg:
        item.profileimg ||
        "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp",
      topicCount: item.topicCount,
      imageCount: item.imageCount,
    }));

    return NextResponse.json({
      range,
      startDate: startDate?.toISOString() || null,
      endDate: endDate?.toISOString() || null,
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching resources leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}


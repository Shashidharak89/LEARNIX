import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

async function getCallerFromBearer(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const caller = await User.findById(decoded.userId).lean();
    return caller;
  } catch {
    return null;
  }
}

export const GET = async (req) => {
  try {
    await connectDB();

    const caller = await getCallerFromBearer(req);
    if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized: Admins only" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") === "active" ? "active" : "highest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const size = Math.max(1, parseInt(searchParams.get("size") || searchParams.get("limit") || "10", 10));
    const search = (searchParams.get("search") || "").trim();
    const skip = (page - 1) * size;

    const sortField = type === "active" ? "streaks" : "highestStreak";
    const secondarySort = type === "active" ? "highestStreak" : "streaks";

    const pipeline = [
      {
        $setWindowFields: {
          sortBy: { [sortField]: -1 },
          output: {
            rank: { $rank: {} },
          },
        },
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { usn: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { [sortField]: -1, [secondarySort]: -1, _id: 1 } },
          { $skip: skip },
          { $limit: size },
          {
            $project: {
              name: 1,
              usn: 1,
              email: 1,
              profileimg: 1,
              role: 1,
              streaks: { $ifNull: ["$streaks", 1] },
              highestStreak: { $ifNull: ["$highestStreak", 1] },
              lastLoginAt: 1,
              rank: 1,
            },
          },
        ],
      },
    });

    const [result] = await User.aggregate(pipeline);
    const total = result?.metadata?.[0]?.total || 0;
    const users = (result?.data || []).map((u) => ({
      ...u,
      role: u.role || "user",
    }));

    const totalPages = Math.ceil(total / size) || 1;
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      type,
      page,
      size,
      total,
      totalPages,
      hasMore,
      users,
    });
  } catch (err) {
    console.error("Admin leaderboard error:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
};

// GET /api/admin/users?page=1&limit=10
// Bearer token required — caller must be admin or superadmin
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  || "1",  10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "12", 10));
    const sort  = searchParams.get("sort") || "createdAt";
    const skip  = (page - 1) * limit;

    const total = await User.countDocuments({});
    let users = [];

    if (sort === "createdAt") {
      users = await User.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name usn profileimg role createdAt lastLoginAt")
        .lean();
    } else {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      users = await User.aggregate([
        {
          $addFields: {
            minutesSinceLastSeen: {
              $cond: [
                { $ne: ["$lastLoginAt", null] },
                {
                  $floor: {
                    $divide: [
                      { $subtract: ["$$NOW", "$lastLoginAt"] },
                      60000,
                    ],
                  },
                },
                null,
              ],
            },
            activityRank: {
              $switch: {
                branches: [
                  { case: { $gte: ["$lastLoginAt", fiveMinutesAgo] }, then: 0 },
                  { case: { $ne: ["$lastLoginAt", null] }, then: 1 },
                ],
                default: 2,
              },
            },
            activitySortValue: {
              $cond: [
                { $gte: ["$lastLoginAt", fiveMinutesAgo] },
                0,
                {
                  $cond: [
                    { $ne: ["$lastLoginAt", null] },
                    "$minutesSinceLastSeen",
                    2147483647,
                  ],
                },
              ],
            },
            nameLower: { $toLower: { $ifNull: ["$name", ""] } },
          },
        },
        { $sort: { activityRank: 1, activitySortValue: 1, nameLower: 1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            name: 1,
            usn: 1,
            profileimg: 1,
            role: 1,
            createdAt: 1,
            lastLoginAt: 1,
          },
        },
      ]);
    }

    // Normalise: if role field is missing, treat as "user"
    const normalized = users.map(u => ({
      ...u,
      role: u.role || "user",
    }));

    return NextResponse.json({
      users: normalized,
      total,
      page,
      limit,
      sort,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin users fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
};

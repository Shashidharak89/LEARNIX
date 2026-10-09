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
    const search = (searchParams.get("search") || "").trim();
    const skip  = (page - 1) * limit;

    const isActivitySort = sort === "activity";
    
    let baseFilter = {};
    if (isActivitySort) {
      baseFilter = { lastLoginAt: { $exists: true, $ne: null, $type: "date" } };
    }

    const searchCondition = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { usn: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : null;

    const finalFilter = searchCondition
      ? (Object.keys(baseFilter).length > 0 ? { $and: [baseFilter, searchCondition] } : searchCondition)
      : baseFilter;

    const total = await User.countDocuments(finalFilter);

    const sortObj = isActivitySort
      ? { lastLoginAt: -1, createdAt: -1 }
      : { createdAt: -1 };

    const users = await User.find(finalFilter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .select("name usn email profileimg role createdAt lastLoginAt")
      .lean();

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
      search,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: page < Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin users fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
};

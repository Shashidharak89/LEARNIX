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
    const skip  = (page - 1) * limit;

    const total = await User.countDocuments({});
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name usn profileimg role createdAt")
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
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin users fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
};

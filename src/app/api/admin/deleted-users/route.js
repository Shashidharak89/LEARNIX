// GET /api/admin/deleted-users
// Admin + superadmin: list all backed-up (deleted) users, paginated
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import BackupUser from "@/models/BackupUser";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

async function getCallerFromBearer(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return await User.findById(decoded.userId).lean();
  } catch { return null; }
}

export const GET = async (req) => {
  try {
    await connectDB();
    const caller = await getCallerFromBearer(req);
    if (!caller || !["admin", "superadmin"].includes(caller.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  || "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "12", 10));
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      BackupUser.find({}).sort({ deletedAt: -1 }).skip(skip).limit(limit).lean(),
      BackupUser.countDocuments({}),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Deleted users list error:", err);
    return NextResponse.json({ error: "Failed to fetch deleted users" }, { status: 500 });
  }
};

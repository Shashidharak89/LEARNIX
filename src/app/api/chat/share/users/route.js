import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

function getCallerId(req) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const callerId = getCallerId(req);
    if (!callerId || !mongoose.Types.ObjectId.isValid(callerId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get("search") || "").trim();
    const pageParam = Number(searchParams.get("page") || 1);
    const limitParam = Number(searchParams.get("limit") || 5);

    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.floor(limitParam), 1), 20)
      : 5;

    const skip = (page - 1) * limit;

    await connectDB();

    const query = {
      _id: { $ne: callerId },
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { usn: { $regex: search, $options: "i" } },
      ];
    }

    const rows = await User.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit + 1)
      .select("_id name usn profileimg")
      .lean();

    const hasMore = rows.length > limit;
    const users = (hasMore ? rows.slice(0, limit) : rows).map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      usn: user.usn,
      profileimg: user.profileimg,
    }));

    return NextResponse.json({
      users,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/chat/share/users error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

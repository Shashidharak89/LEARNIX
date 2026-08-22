import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import User from "@/models/User";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

function getUserIdFromAuthHeader(req) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    await connectDB();

    let userId = getUserIdFromAuthHeader(req);

    const url = new URL(req.url);
    const indexParam = url.searchParams.get("index") || url.searchParams.get("page") || "1";
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("pageSize") || "10";
    const queryUserIdParam = (url.searchParams.get("userId") || "").trim();

    if (!userId && queryUserIdParam) {
      if (mongoose.Types.ObjectId.isValid(queryUserIdParam)) {
        userId = queryUserIdParam;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid JWT token in Authorization header" }, { status: 401 });
    }

    const pageIndex = Math.max(1, parseInt(indexParam, 10) || 1);
    const pageSize = Math.max(1, Math.min(50, parseInt(limitParam, 10) || 10));
    const skip = (pageIndex - 1) * pageSize;

    // Fetch ALL updates for this user regardless of visibility (public, private, unlisted)
    const filter = { userId: userId };

    const totalCount = await Update.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = pageIndex < totalPages || (skip + pageSize < totalCount);

    const updates = await Update.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const user = await User.findById(userId).lean();

    const enriched = updates.map((u) => ({
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
    }));

    return NextResponse.json(
      {
        updates: enriched,
        pagination: {
          page: pageIndex,
          pageSize: pageSize,
          totalCount: totalCount,
          totalPages: totalPages,
          hasMore: hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/user/updates error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

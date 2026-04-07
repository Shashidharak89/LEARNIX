import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Message from "@/models/Message";

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
    const pageParam = Number(searchParams.get("page") || 1);
    const limitParam = Number(searchParams.get("limit") || 20);

    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.floor(limitParam), 1), 50)
      : 20;

    const skip = (page - 1) * limit;

    await connectDB();

    const callerObjectId = new mongoose.Types.ObjectId(callerId);

    const grouped = await Message.aggregate([
      {
        $match: {
          $or: [{ from: callerObjectId }, { to: callerObjectId }],
        },
      },
      {
        $addFields: {
          partnerId: {
            $cond: [{ $eq: ["$from", callerObjectId] }, "$to", "$from"],
          },
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $group: {
          _id: "$partnerId",
          lastMessage: { $first: "$content" },
          lastTimestamp: { $first: "$createdAt" },
          lastFrom: { $first: "$from" },
          lastTo: { $first: "$to" },
        },
      },
      { $sort: { lastTimestamp: -1, _id: -1 } },
      { $skip: skip },
      { $limit: limit + 1 },
    ]);

    const hasMore = grouped.length > limit;
    const rows = hasMore ? grouped.slice(0, limit) : grouped;

    const partnerIds = rows.map((row) => row._id).filter(Boolean);
    const users = await User.find({ _id: { $in: partnerIds } })
      .select("_id name usn profileimg")
      .lean();

    const usersById = new Map(users.map((user) => [String(user._id), user]));

    const conversations = rows
      .map((row) => {
        const participant = usersById.get(String(row._id));
        if (!participant) return null;

        return {
          participant: {
            _id: participant._id.toString(),
            name: participant.name,
            usn: participant.usn,
            profileimg: participant.profileimg,
          },
          lastMessage: row.lastMessage,
          lastTimestamp: row.lastTimestamp,
          lastFrom: row.lastFrom?.toString?.() || String(row.lastFrom),
          lastTo: row.lastTo?.toString?.() || String(row.lastTo),
        };
      })
      .filter(Boolean);

    return NextResponse.json(
      {
        currentUserId: callerId,
        page,
        limit,
        conversations,
        hasMore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

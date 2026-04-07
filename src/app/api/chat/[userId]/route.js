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

function mapMessage(message) {
  return {
    _id: message._id?.toString(),
    content: message.content,
    from: message.from?.toString?.() || String(message.from),
    to: message.to?.toString?.() || String(message.to),
    timestamp: message.createdAt,
  };
}

export async function GET(req, context) {
  try {
    const callerId = getCallerId(req);
    if (!callerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    await connectDB();

    const otherUser = await User.findById(userId)
      .select("_id name usn profileimg")
      .lean();

    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get("limit") || 20);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;

    const cursor = searchParams.get("cursor");
    const filter = {
      $or: [
        { from: callerId, to: userId },
        { from: userId, to: callerId },
      ],
    };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    const rows = await Message.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const messages = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore && messages.length > 0
      ? messages[messages.length - 1].createdAt
      : null;

    return NextResponse.json(
      {
        currentUserId: callerId,
        participant: {
          _id: otherUser._id.toString(),
          name: otherUser.name,
          usn: otherUser.usn,
          profileimg: otherUser.profileimg,
        },
        messages: messages.map(mapMessage),
        hasMore,
        nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/chat/[userId] error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req, context) {
  try {
    const callerId = getCallerId(req);
    if (!callerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await req.json();
    const content = String(body?.content || "").trim();

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    await connectDB();

    const recipient = await User.findById(userId).select("_id").lean();
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    const created = await Message.create({
      content,
      from: callerId,
      to: userId,
    });

    return NextResponse.json({ message: mapMessage(created) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat/[userId] error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

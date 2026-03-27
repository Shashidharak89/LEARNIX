import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const updates = await Update.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const userIds = updates.map((update) => update.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const enriched = updates.map((update) => {
      const userKey = update.userId ? update.userId.toString() : null;
      const user = userKey ? userMap[userKey] : null;

      return {
        _id: update._id,
        title: update.title,
        content: update.content,
        links: update.links || [],
        files: update.files || [],
        createdAt: update.createdAt,
        userId: update.userId || null,
        name: user?.name || null,
        usn: user?.usn || null,
      };
    });

    return NextResponse.json({ updates: enriched }, { status: 200 });
  } catch (error) {
    console.error("GET /api/updates/preview error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

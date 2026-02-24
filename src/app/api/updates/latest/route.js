import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const indexParam = url.searchParams.get('index') || '1';
    const pageIndex = Math.max(1, parseInt(indexParam, 10) || 1);
    const pageSize = 10;
    const skip = (pageIndex - 1) * pageSize;

    const updates = await Update.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const userIds = updates.map(u => u.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const enriched = updates.map(u => {
      const uid = u.userId ? u.userId.toString() : null;
      const user = uid ? userMap[uid] : null;
      return {
        _id: u._id,
        title: u.title,
        content: u.content,
        links: u.links || [],
        files: u.files || [],
        userId: u.userId,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        usn: user?.usn || null,
        name: user?.name || null,
        profileUrl: user?.profileimg || null,
      };
    });

    return NextResponse.json({ updates: enriched }, { status: 200 });
  } catch (error) {
    console.error('GET /api/updates/latest error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

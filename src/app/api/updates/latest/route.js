import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import User from "@/models/User";
import { recordUpdateViews } from "@/lib/interactions";

export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const indexParam = url.searchParams.get('index') || '1';
    const userId = (url.searchParams.get('userId') || '').trim();
    const pageIndex = Math.max(1, parseInt(indexParam, 10) || 1);
    const pageSize = 10;
    const skip = (pageIndex - 1) * pageSize;

    const currentUserId = (url.searchParams.get('currentUserId') || '').trim();
    const query = {};
    if (userId) {
      query.userId = userId;
      if (currentUserId !== userId) {
        query.$or = [
          { visibility: "public" },
          { visibility: "unlisted" },
          { visibility: { $exists: false } }
        ];
      }
    } else {
      query.$or = [
        { visibility: "public" },
        { visibility: "unlisted" },
        { visibility: { $exists: false } }
      ];
    }

    const updates = await Update.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const userIds = updates.map(u => u.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const updateIds = updates.map(u => u._id);
    const viewsMap = await recordUpdateViews(updateIds);

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
        visibility: u.visibility || "public",
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        usn: user?.usn || null,
        name: user?.name || null,
        profileUrl: user?.profileimg || null,
        views: viewsMap[u._id.toString()] ?? 0,
      };
    });

    return NextResponse.json({ updates: enriched }, { status: 200 });
  } catch (error) {
    console.error('GET /api/updates/latest error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

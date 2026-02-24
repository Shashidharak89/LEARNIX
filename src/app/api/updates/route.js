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

    // Collect userIds and fetch user info
    const userIds = updates.map(u => u.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

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
    console.error('GET /api/updates error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { title, content, links, userId, files } = body || {};

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId).lean();
      if (!user) {
        return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
      }
    }

    const updateDoc = new Update({
      title,
      content,
      links: Array.isArray(links) ? links : (links ? [links] : []),
      files: Array.isArray(files) ? files : (files ? [files] : []),
      userId: userId || null,
    });

    await updateDoc.save();

    const enriched = {
      _id: updateDoc._id,
      title: updateDoc.title,
      content: updateDoc.content,
      links: updateDoc.links || [],
      files: updateDoc.files || [],
      userId: updateDoc.userId,
      createdAt: updateDoc.createdAt,
      updatedAt: updateDoc.updatedAt,
      usn: user?.usn || null,
      name: user?.name || null,
      profileUrl: user?.profileimg || null,
    };

    return NextResponse.json({ update: enriched }, { status: 201 });
  } catch (error) {
    console.error('POST /api/updates error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

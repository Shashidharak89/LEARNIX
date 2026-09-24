import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import User from "@/models/User";
import mongoose from "mongoose";
import redis, { invalidateUpdatesCache } from "@/lib/redis";

const CACHE_TTL_SECONDS = 300; // 5 minutes cache TTL

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const searchParamsString = url.searchParams.toString() || 'default';
    const cacheKey = `updates:${searchParamsString}`;

    // Try reading from Redis cache
    if (redis) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return NextResponse.json(JSON.parse(cachedData), {
            status: 200,
            headers: {
              "X-Cache": "HIT",
              "Cache-Control": "public, max-age=300, s-maxage=300",
            },
          });
        }
      } catch (cacheError) {
        console.warn("[Redis Cache Read Error]:", cacheError.message);
      }
    }

    await connectDB();

    const indexParam = url.searchParams.get('index') || '1';
    const currentUserId = (url.searchParams.get('userId') || '').trim();
    const pageIndex = Math.max(1, parseInt(indexParam, 10) || 1);
    const rawQuery = (url.searchParams.get('q') || '').trim();
    const pageSize = 10;
    const skip = (pageIndex - 1) * pageSize;

    const visibilityConditions = [
      { visibility: "public" },
      { visibility: "unlisted" },
      { visibility: { $exists: false } }
    ];
    if (currentUserId) {
      visibilityConditions.push({ visibility: "private", userId: currentUserId });
    }

    const updateQuery = {
      $or: visibilityConditions
    };

    if (rawQuery) {
      const regex = new RegExp(escapeRegex(rawQuery), 'i');
      const matchedUsers = await User.find(
        { $or: [{ name: regex }, { usn: regex }] },
        { _id: 1 }
      ).lean();
      const matchedUserIds = matchedUsers.map((u) => u._id);

      const searchConditions = [
        { title: regex },
        { content: regex },
        { links: { $elemMatch: { $regex: regex } } },
        { 'files.name': regex },
        { 'files.url': regex },
      ];

      if (matchedUserIds.length > 0) {
        searchConditions.push({ userId: { $in: matchedUserIds } });
      }

      updateQuery.$and = [
        { $or: visibilityConditions },
        { $or: searchConditions }
      ];
      delete updateQuery.$or;
    }

    const specificId = (url.searchParams.get('id') || url.searchParams.get('updateId') || url.searchParams.get('update') || '').trim();

    let updates = await Update.find(updateQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    if (pageIndex === 1 && specificId && mongoose.Types.ObjectId.isValid(specificId)) {
      const alreadyIncluded = updates.some(u => u._id.toString() === specificId);
      if (!alreadyIncluded) {
        const specificDoc = await Update.findById(specificId).lean();
        if (specificDoc) {
          const isAllowed =
            specificDoc.visibility === 'public' ||
            specificDoc.visibility === 'unlisted' ||
            !specificDoc.visibility ||
            (currentUserId && specificDoc.userId?.toString() === currentUserId);
          if (isAllowed) {
            updates = [specificDoc, ...updates];
          }
        }
      }
    }

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
        visibility: u.visibility || "public",
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        usn: user?.usn || null,
        name: user?.name || null,
        profileUrl: user?.profileimg || null,
      };
    });

    const responseData = { updates: enriched };

    // Save to Redis cache for 5 minutes (300 seconds)
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", CACHE_TTL_SECONDS);
      } catch (cacheSetErr) {
        console.warn("[Redis Cache Write Error]:", cacheSetErr.message);
      }
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error('GET /api/updates error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { title, content, links, userId, files, visibility } = body || {};

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

    const validVisibility = ["public", "private", "unlisted"].includes(visibility) ? visibility : "public";

    const updateDoc = new Update({
      title,
      content,
      links: Array.isArray(links) ? links : (links ? [links] : []),
      files: Array.isArray(files) ? files : (files ? [files] : []),
      userId: userId || null,
      visibility: validVisibility,
    });

    await updateDoc.save();

    // Invalidate updates cache on new update creation
    await invalidateUpdatesCache();

    const enriched = {
      _id: updateDoc._id,
      title: updateDoc.title,
      content: updateDoc.content,
      links: updateDoc.links || [],
      files: updateDoc.files || [],
      userId: updateDoc.userId,
      visibility: updateDoc.visibility || "public",
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

// Delete an update
export async function DELETE(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const updateId = url.searchParams.get('id');

    if (!updateId) {
      return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
    }

    const result = await Update.findByIdAndDelete(updateId);

    if (!result) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // Invalidate updates cache on update deletion
    await invalidateUpdatesCache();

    return NextResponse.json({ message: 'Update deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/updates error:', error);
    return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 });
  }
}


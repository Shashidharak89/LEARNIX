import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import User from "@/models/User";
import mongoose from "mongoose";
import { recordUpdateViews } from "@/lib/interactions";
import {
  buildUpdateKeywordConditions,
  scoreAndTagUpdate,
  getQueryWords,
} from "@/lib/searchHelper";

export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const indexParam = url.searchParams.get("index") || "1";
    const currentUserId = (url.searchParams.get("userId") || "").trim();
    const pageIndex = Math.max(1, parseInt(indexParam, 10) || 1);
    const rawQuery = (url.searchParams.get("q") || "").trim();
    const pageSize = 10;
    const skip = (pageIndex - 1) * pageSize;

    const visibilityConditions = [
      { visibility: "public" },
      { visibility: "unlisted" },
      { visibility: { $exists: false } },
    ];
    if (currentUserId) {
      visibilityConditions.push({ visibility: "private", userId: currentUserId });
    }

    const specificId = (
      url.searchParams.get("id") ||
      url.searchParams.get("updateId") ||
      url.searchParams.get("update") ||
      ""
    ).trim();

    // ── SEARCH MODE ─────────────────────────────────────────────────────────────
    if (rawQuery) {
      const searchConditions = await buildUpdateKeywordConditions(rawQuery);
      const updateQuery = {
        $and: [
          { $or: visibilityConditions },
          searchConditions.length > 0 ? { $or: searchConditions } : {},
        ],
      };

      // Fetch candidate updates (up to 300) to allow accurate relevance ranking
      let candidateUpdates = await Update.find(updateQuery)
        .limit(300)
        .lean();

      if (
        pageIndex === 1 &&
        specificId &&
        mongoose.Types.ObjectId.isValid(specificId)
      ) {
        const alreadyIncluded = candidateUpdates.some(
          (u) => u._id.toString() === specificId
        );
        if (!alreadyIncluded) {
          const specificDoc = await Update.findById(specificId).lean();
          if (specificDoc) {
            const isAllowed =
              specificDoc.visibility === "public" ||
              specificDoc.visibility === "unlisted" ||
              !specificDoc.visibility ||
              (currentUserId &&
                specificDoc.userId?.toString() === currentUserId);
            if (isAllowed) {
              candidateUpdates.unshift(specificDoc);
            }
          }
        }
      }

      // Batch fetch users
      const userIds = [
        ...new Set(
          candidateUpdates
            .map((u) => u.userId?.toString())
            .filter(Boolean)
        ),
      ];
      const users = await User.find({ _id: { $in: userIds } })
        .select("name usn profileimg")
        .lean();
      const userMap = {};
      users.forEach((u) => {
        userMap[u._id.toString()] = u;
      });

      // Record views
      const candidateIds = candidateUpdates.map((u) => u._id);
      const viewsMap = await recordUpdateViews(candidateIds);

      // Enrich and score each update against the query
      const scoredUpdates = candidateUpdates.map((u) => {
        const uid = u.userId ? u.userId.toString() : null;
        const user = uid ? userMap[uid] : null;
        const base = {
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
        return scoreAndTagUpdate(base, rawQuery);
      });

      // Rank by relevance score descending (most matching on top), secondary by newest
      scoredUpdates.sort((a, b) => {
        if (specificId && a._id.toString() === specificId) return -1;
        if (specificId && b._id.toString() === specificId) return 1;
        if ((b.matchScore || 0) !== (a.matchScore || 0)) {
          return (b.matchScore || 0) - (a.matchScore || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const pagedUpdates = scoredUpdates.slice(skip, skip + pageSize);

      return NextResponse.json(
        {
          updates: pagedUpdates,
          total: scoredUpdates.length,
          searchWords: getQueryWords(rawQuery),
        },
        { status: 200 }
      );
    }

    // ── BROWSING MODE (No Search Query) ─────────────────────────────────────────
    const updateQuery = {
      $or: visibilityConditions,
    };

    let updates = await Update.find(updateQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    if (
      pageIndex === 1 &&
      specificId &&
      mongoose.Types.ObjectId.isValid(specificId)
    ) {
      const alreadyIncluded = updates.some(
        (u) => u._id.toString() === specificId
      );
      if (!alreadyIncluded) {
        const specificDoc = await Update.findById(specificId).lean();
        if (specificDoc) {
          const isAllowed =
            specificDoc.visibility === "public" ||
            specificDoc.visibility === "unlisted" ||
            !specificDoc.visibility ||
            (currentUserId && specificDoc.userId?.toString() === currentUserId);
          if (isAllowed) {
            updates = [specificDoc, ...updates];
          }
        }
      }
    }

    // Collect userIds and batch fetch user info
    const userIds = [
      ...new Set(updates.map((u) => u.userId?.toString()).filter(Boolean)),
    ];
    const users = await User.find({ _id: { $in: userIds } })
      .select("name usn profileimg")
      .lean();
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    // Increment & retrieve atomic view counts for the fetched updates
    const updateIds = updates.map((u) => u._id);
    const viewsMap = await recordUpdateViews(updateIds);

    const enriched = updates.map((u) => {
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
    console.error("GET /api/updates error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    let { title, content, links, userId, files, visibility } = body || {};

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    let user = null;
    const { resolveAuthenticatedUser } = await import("@/lib/authUser");
    const authUser = await resolveAuthenticatedUser(req);

    if (authUser?._id) {
      user = authUser;
      userId = authUser._id;
    } else if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).lean();
      if (!user) {
        return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'User must be signed in to create an update' }, { status: 401 });
    }

    const validVisibility = ["public", "private", "unlisted"].includes(visibility) ? visibility : "public";

    // Clean and validate file objects matching FileSchema
    const sanitizedFiles = Array.isArray(files)
      ? files
          .filter(f => f && (f.url || typeof f === 'string'))
          .map(f => {
            if (typeof f === 'string') {
              return { url: f, publicId: f.split('/').pop() || 'file', name: f.split('/').pop(), resourceType: 'auto' };
            }
            return {
              url: f.url,
              publicId: f.publicId || f.url?.split('/').pop() || 'file',
              name: f.name || f.url?.split('/').pop() || 'Attachment',
              resourceType: f.resourceType || 'auto',
            };
          })
      : [];

    const updateDoc = new Update({
      title: title.trim(),
      content: content.trim(),
      links: Array.isArray(links) ? links : (links ? [links] : []),
      files: sanitizedFiles,
      userId: user._id,
      visibility: validVisibility,
    });

    await updateDoc.save();

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

    return NextResponse.json({ message: 'Update deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/updates error:', error);
    return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 });
  }
}


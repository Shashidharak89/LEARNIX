import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";
import User from "@/models/User";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import { formatGithubRawUrl } from "@/lib/githubUrlHelper";
import { normalizeVisibility } from "@/lib/visibility";

// GET /api/admin/resources/topics?page=1&size=20&search=""&userId=""&usn=""&subjectId=""
export async function GET(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const size = Math.max(1, Math.min(100, parseInt(searchParams.get("size") || searchParams.get("pageSize") || "20", 10)));
    const search = (searchParams.get("search") || "").trim();
    const userId = (searchParams.get("userId") || "").trim();
    const usn = (searchParams.get("usn") || "").trim();
    const subjectId = (searchParams.get("subjectId") || "").trim();

    const filter = {};

    // Filter by subject
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      filter.subjectId = new mongoose.Types.ObjectId(subjectId);
    }

    // Filter by specific user ID
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    } else if (usn) {
      const matchedUser = await User.findOne({ usn: usn.toUpperCase() }).select("_id").lean();
      if (matchedUser) {
        filter.userId = matchedUser._id;
      } else {
        return NextResponse.json({
          topics: [],
          total: 0,
          page,
          size,
          totalPages: 0,
        });
      }
    }

    // Search filter across topic title, content, or matched subject/user
    if (search) {
      const escapeRegex = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const regex = new RegExp(escapeRegex, "i");

      const [matchingUsers, matchingSubjects] = await Promise.all([
        User.find({ $or: [{ name: regex }, { usn: regex }] }).select("_id").lean(),
        Subject.find({ subject: regex }).select("_id").lean(),
      ]);

      const matchingUserIds = matchingUsers.map((u) => u._id);
      const matchingSubjectIds = matchingSubjects.map((s) => s._id);

      const searchConditions = [
        { topic: regex },
        { content: regex },
      ];

      if (matchingSubjectIds.length > 0) {
        searchConditions.push({ subjectId: { $in: matchingSubjectIds } });
      }
      if (matchingUserIds.length > 0) {
        searchConditions.push({ userId: { $in: matchingUserIds } });
      }

      const existingConditions = [];
      if (filter.subjectId) existingConditions.push({ subjectId: filter.subjectId });
      if (filter.userId) existingConditions.push({ userId: filter.userId });

      if (existingConditions.length > 0) {
        filter.$and = [...existingConditions, { $or: searchConditions }];
        delete filter.subjectId;
        delete filter.userId;
      } else {
        filter.$or = searchConditions;
      }
    }

    const total = await Topic.countDocuments(filter);
    const skip = (page - 1) * size;
    const topics = await Topic.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(size)
      .lean();

    // Populate subject and user information
    const subjectIds = [...new Set(topics.map((t) => t.subjectId?.toString()).filter(Boolean))];
    const userIds = [...new Set(topics.map((t) => t.userId?.toString()).filter(Boolean))];

    const [subjects, users] = await Promise.all([
      Subject.find({ _id: { $in: subjectIds } }).select("_id subject visibility").lean(),
      User.find({ _id: { $in: userIds } }).select("_id name usn email profileimg role").lean(),
    ]);

    const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const enrichedTopics = topics.map((t) => {
      const subjectDoc = subjectMap.get(t.subjectId?.toString());
      const userDoc = userMap.get(t.userId?.toString());

      return {
        ...t,
        subject: subjectDoc ? subjectDoc.subject : null,
        subjectId: subjectDoc ? subjectDoc._id : t.subjectId,
        subjectVisibility: subjectDoc ? subjectDoc.visibility : null,
        userName: userDoc ? userDoc.name : null,
        usn: userDoc ? userDoc.usn : null,
        profileimg: userDoc ? userDoc.profileimg : null,
        userId: userDoc ? userDoc._id : t.userId,
      };
    });

    return NextResponse.json({
      topics: enrichedTopics,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    });
  } catch (err) {
    console.error("GET /api/admin/resources/topics error:", err);
    return NextResponse.json(
      { error: "Failed to fetch topics", details: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/resources/topics
// Body: { topicId, visibility, downloadlink, topic }
export async function PATCH(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { topicId, visibility, downloadlink, topic } = await req.json();

    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      return NextResponse.json({ error: "Valid topicId is required" }, { status: 400 });
    }

    const topicDoc = await Topic.findById(topicId);
    if (!topicDoc) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (visibility !== undefined) {
      topicDoc.visibility = normalizeVisibility(visibility);
    }

    if (downloadlink !== undefined) {
      topicDoc.downloadlink = formatGithubRawUrl(downloadlink);
    }

    if (typeof topic === "string" && topic.trim()) {
      topicDoc.topic = topic.trim();
    }

    await topicDoc.save();

    return NextResponse.json({
      success: true,
      message: "Topic updated successfully",
      topic: topicDoc,
    });
  } catch (err) {
    console.error("PATCH /api/admin/resources/topics error:", err);
    return NextResponse.json(
      { error: "Failed to update topic", details: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/resources/topics?topicId=...
export async function DELETE(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");

    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      return NextResponse.json({ error: "Valid topicId is required" }, { status: 400 });
    }

    const topicDoc = await Topic.findByIdAndDelete(topicId);
    if (!topicDoc) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Topic "${topicDoc.topic}" deleted successfully.`,
    });
  } catch (err) {
    console.error("DELETE /api/admin/resources/topics error:", err);
    return NextResponse.json(
      { error: "Failed to delete topic", details: err.message },
      { status: 500 }
    );
  }
}

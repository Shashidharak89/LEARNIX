import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import User from "@/models/User";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import { normalizeVisibility } from "@/lib/visibility";

// GET /api/admin/resources/subjects?page=1&size=20&search=""&userId=""&usn=""
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

    const filter = {};

    // Filter by specific user ID
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    } else if (usn) {
      // Filter by USN
      const matchedUser = await User.findOne({ usn: usn.toUpperCase() }).select("_id").lean();
      if (matchedUser) {
        filter.userId = matchedUser._id;
      } else {
        return NextResponse.json({
          subjects: [],
          total: 0,
          page,
          size,
          totalPages: 0,
        });
      }
    }

    // Search filter across subject title or user name/usn
    if (search) {
      const escapeRegex = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const regex = new RegExp(escapeRegex, "i");

      const matchingUsers = await User.find({
        $or: [{ name: regex }, { usn: regex }],
      }).select("_id").lean();
      const matchingUserIds = matchingUsers.map((u) => u._id);

      const searchConditions = [{ subject: regex }];
      if (matchingUserIds.length > 0) {
        searchConditions.push({ userId: { $in: matchingUserIds } });
      }

      if (filter.userId) {
        filter.$and = [{ userId: filter.userId }, { $or: searchConditions }];
        delete filter.userId;
      } else {
        filter.$or = searchConditions;
      }
    }

    const total = await Subject.countDocuments(filter);
    const skip = (page - 1) * size;
    const subjects = await Subject.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .lean();

    // Populate user and topic counts
    const userIds = [...new Set(subjects.map((s) => s.userId?.toString()).filter(Boolean))];
    const subjectIds = subjects.map((s) => s._id);

    const [users, topicCounts] = await Promise.all([
      User.find({ _id: { $in: userIds } })
        .select("_id name usn email profileimg role")
        .lean(),
      Topic.aggregate([
        { $match: { subjectId: { $in: subjectIds } } },
        { $group: { _id: "$subjectId", count: { $sum: 1 } } },
      ]),
    ]);

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const countMap = new Map(topicCounts.map((tc) => [tc._id.toString(), tc.count]));

    const enrichedSubjects = subjects.map((s) => ({
      ...s,
      user: userMap.get(s.userId?.toString()) || null,
      topicsCount: countMap.get(s._id.toString()) || 0,
    }));

    return NextResponse.json({
      subjects: enrichedSubjects,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    });
  } catch (err) {
    console.error("GET /api/admin/resources/subjects error:", err);
    return NextResponse.json(
      { error: "Failed to fetch subjects", details: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/resources/subjects
// Body: { subjectId, visibility, subject }
export async function PATCH(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { subjectId, visibility, subject } = await req.json();
    if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
      return NextResponse.json({ error: "Valid subjectId is required" }, { status: 400 });
    }

    const subjectDoc = await Subject.findById(subjectId);
    if (!subjectDoc) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (visibility !== undefined) {
      subjectDoc.visibility = normalizeVisibility(visibility);
    }

    if (typeof subject === "string" && subject.trim()) {
      subjectDoc.subject = subject.trim();
    }

    await subjectDoc.save();

    return NextResponse.json({
      success: true,
      message: "Subject updated successfully",
      subject: subjectDoc,
    });
  } catch (err) {
    console.error("PATCH /api/admin/resources/subjects error:", err);
    return NextResponse.json(
      { error: "Failed to update subject", details: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/resources/subjects?subjectId=...&cascadeTopics=true
export async function DELETE(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const cascadeTopics = searchParams.get("cascadeTopics") === "true";

    if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
      return NextResponse.json({ error: "Valid subjectId is required" }, { status: 400 });
    }

    const subjectDoc = await Subject.findById(subjectId);
    if (!subjectDoc) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    let deletedTopicsCount = 0;
    if (cascadeTopics) {
      const deleteResult = await Topic.deleteMany({ subjectId: subjectDoc._id });
      deletedTopicsCount = deleteResult.deletedCount;
    }

    await Subject.findByIdAndDelete(subjectDoc._id);

    return NextResponse.json({
      success: true,
      message: `Subject "${subjectDoc.subject}" deleted${cascadeTopics ? ` along with ${deletedTopicsCount} topic(s)` : ""}.`,
      deletedTopicsCount,
    });
  } catch (err) {
    console.error("DELETE /api/admin/resources/subjects error:", err);
    return NextResponse.json(
      { error: "Failed to delete subject", details: err.message },
      { status: 500 }
    );
  }
}

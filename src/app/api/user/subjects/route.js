import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const authUser = await resolveAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const usnParam = searchParams.get("usn");

    let targetUser = null;
    let isOwner = false;

    if (usnParam) {
      targetUser = await User.findOne({
        usn: { $regex: new RegExp(`^${usnParam.trim()}$`, "i") }
      }).lean();

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      isOwner = Boolean(authUser && authUser._id.toString() === targetUser._id.toString());
    } else {
      if (!authUser) {
        return NextResponse.json(
          { error: "Unauthorized. Valid authentication token required." },
          { status: 401 }
        );
      }
      targetUser = authUser;
      isOwner = true;
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const size = Math.max(1, parseInt(searchParams.get("size") || "10", 10));
    const search = (searchParams.get("search") || "").trim();
    const order = (searchParams.get("order") || "asc").toLowerCase() === "desc" ? "desc" : "asc";

    const filter = { userId: targetUser._id };
    if (!isOwner) {
      filter.$or = [{ visibility: "public" }, { visibility: { $exists: false } }];
    }

    if (search) {
      const topicFilter = {
        userId: targetUser._id,
        topic: { $regex: search, $options: "i" }
      };
      if (!isOwner) {
        topicFilter.$or = [{ visibility: "public" }, { visibility: { $exists: false } }];
      }

      const matchingTopicSubjectIds = await Topic.find(topicFilter).distinct("subjectId");

      const searchCondition = [
        { subject: { $regex: search, $options: "i" } },
        { _id: { $in: matchingTopicSubjectIds } }
      ];

      if (!isOwner) {
        filter.$and = [
          { $or: [{ visibility: "public" }, { visibility: { $exists: false } }] },
          { $or: searchCondition }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchCondition;
      }
    }

    const sortDirection = order === "desc" ? -1 : 1;
    const totalRecords = await Subject.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / size) || 1;

    const subjects = await Subject.find(filter)
      .collation({ locale: "en", strength: 2 })
      .sort({ subject: sortDirection })
      .skip((page - 1) * size)
      .limit(size)
      .lean();

    const subjectIds = subjects.map((s) => s._id);

    const matchTopicFilter = { subjectId: { $in: subjectIds } };
    if (!isOwner) {
      matchTopicFilter.$or = [{ visibility: "public" }, { visibility: { $exists: false } }];
    }

    const topicCounts = await Topic.aggregate([
      { $match: matchTopicFilter },
      { $group: { _id: "$subjectId", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    topicCounts.forEach((tc) => {
      countMap[tc._id.toString()] = tc.count;
    });

    const formattedSubjects = subjects.map((s) => ({
      _id: s._id.toString(),
      subject: s.subject,
      visibility: s.visibility || "public",
      createdAt: s.createdAt,
      topicsCount: countMap[s._id.toString()] || 0
    }));

    return NextResponse.json({
      success: true,
      subjects: formattedSubjects,
      pagination: {
        page,
        size,
        totalPages,
        totalRecords,
        search,
        order
      }
    });
  } catch (error) {
    console.error("Error fetching user subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch user subjects", details: error.message },
      { status: 500 }
    );
  }
}

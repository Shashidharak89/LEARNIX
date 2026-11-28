import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export async function GET(req) {
  try {
    await connectDB();

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!auth.user) {
      return NextResponse.json({ error: "Authentication required. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const size = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("size") || "20", 10) || 20));
    const search = (searchParams.get("search") || "").trim();
    const query = { userId: auth.user._id };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      const matchingTopics = await Topic.find({
        userId: auth.user._id,
        $or: [{ topic: regex }, { content: regex }],
      }).distinct("subjectId");

      query.$or = [{ subject: regex }, { _id: { $in: matchingTopics } }];
    }

    const total = await Subject.countDocuments(query);
    const subjects = await Subject.find(query)
      .select("_id subject visibility")
      .sort({ _id: -1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean();

    const subjectIds = subjects.map((subject) => subject._id);
    const topicCounts = subjectIds.length
      ? await Topic.aggregate([
          { $match: { subjectId: { $in: subjectIds } } },
          { $group: { _id: "$subjectId", count: { $sum: 1 } } },
        ])
      : [];
    const topicCountBySubject = new Map(
      topicCounts.map((entry) => [String(entry._id), entry.count])
    );

    return NextResponse.json({
      subjects: subjects.map((subject) => ({
        _id: subject._id,
        subject: subject.subject,
        visibility: subject.visibility || "public",
        topicCount: topicCountBySubject.get(String(subject._id)) || 0,
      })),
      paging: {
        page,
        size,
        total,
        returned: subjects.length,
        hasMore: page * size < total,
      },
      search,
    });
  } catch (error) {
    console.error("GET /api/work/get error:", error);
    return NextResponse.json({ error: "Failed to fetch subjects." }, { status: 500 });
  }
}

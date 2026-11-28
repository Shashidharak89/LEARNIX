import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const GET = async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const subjectName = searchParams.get("subject");
    const subjectId = searchParams.get("subjectId");
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const size = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("size") || searchParams.get("limit") || "20", 10) || 20));
    const search = (searchParams.get("search") || "").trim();

    // The upload page requests a subject ID. Require a valid bearer token and
    // scope the topic list to the authenticated user's own subject.
    if (subjectId) {
      const auth = await resolveAuthenticatedUser(request, { withMeta: true });
      if (!auth.user) {
        return NextResponse.json({ error: "Authentication required. Please log in." }, { status: 401 });
      }

      const subject = await Subject.findOne({ _id: subjectId, userId: auth.user._id })
        .select("_id")
        .lean();
      if (!subject) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      }

      const query = { subjectId: subject._id, userId: auth.user._id };
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        query.$or = [{ topic: regex }, { content: regex }];
      }

      const total = await Topic.countDocuments(query);
      const topics = await Topic.find(query)
        .select("_id subjectId topic visibility timestamp")
        .sort({ timestamp: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .lean();

      return NextResponse.json({
        subjectId: subject._id,
        topics: topics.map((topic) => ({
          _id: topic._id,
          subjectId: topic.subjectId,
          topic: topic.topic,
          visibility: topic.visibility || "public",
          timestamp: topic.timestamp,
        })),
        paging: { page, size, limit: size, total, returned: topics.length, hasMore: page * size < total },
        search,
      });
    }

    // The subject-name variant remains the public topic-name lookup used by
    // the search filter, and returns names only.
    if (!subjectName) {
      return NextResponse.json({ error: "subject or subjectId parameter is required" }, { status: 400 });
    }

    const subjects = await Subject.find({
      subject: subjectName,
      $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
    }).select("_id").lean();

    const subjectIds = subjects.map((subject) => subject._id);
    const topics = await Topic.aggregate([
      {
        $match: {
          subjectId: { $in: subjectIds },
          $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
          topic: { $exists: true, $nin: ["", null] },
        },
      },
      { $group: { _id: "$topic", latestTimestamp: { $max: "$timestamp" } } },
      { $sort: { latestTimestamp: -1, _id: 1 } },
      { $project: { _id: 0, name: "$_id" } },
    ]);

    return NextResponse.json({ subject: subjectName, topics: topics.map((topic) => topic.name), count: topics.length });
  } catch (error) {
    console.error("GET /api/topic/by-subject error:", error);
    return NextResponse.json({ error: "Failed to fetch topics." }, { status: 500 });
  }
};

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import RequestMetric from "@/models/RequestMetric";
import { buildKeywordConditions, scoreAndTagTopic, getQueryWords } from "@/lib/searchHelper";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import { recordResourceViews } from "@/lib/interactions";

export const dynamic = "force-dynamic";

/**
 * GET /api/resources?page=1&size=10&search=""
 * Unified endpoint for fetching and searching resources (topics).
 * Only this endpoint tracks view counts on the returned resources.
 */
export async function GET(req) {
  try {
    await connectDB();

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (auth.tokenProvided && auth.tokenInvalid) {
      return NextResponse.json(
        { error: "Token expired or invalid. Please login again." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    let search = (searchParams.get("search") ?? searchParams.get("q") ?? "").trim();
    if (search === '""' || search === "''") {
      search = "";
    }
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const size = Math.max(1, parseInt(searchParams.get("size") || searchParams.get("pageSize") || "10", 10));
    const skip = (page - 1) * size;
    const sortOrder = (searchParams.get("sort") || "latest").toLowerCase();

    // Filters (subjects, topics)
    const subjectsFilter = (searchParams.get("subjects") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const topicsFilter = (searchParams.get("topics") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // Build query conditions
    const queryConditions = [
      { $or: [{ visibility: "public" }, { visibility: { $exists: false } }] },
    ];

    // If search term provided
    if (search) {
      const orConditions = await buildKeywordConditions(search);
      if (orConditions.length > 0) {
        queryConditions.push({ $or: orConditions });
      }
    }

    // Subject filter
    if (subjectsFilter.length > 0) {
      const matchedSubjects = await Subject.find({
        subject: {
          $in: subjectsFilter.map(
            (s) => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i")
          ),
        },
      }).lean();
      const matchedSubjectIds = matchedSubjects.map((s) => s._id);
      if (matchedSubjectIds.length === 0) {
        return NextResponse.json({
          topics: [],
          total: 0,
          totalResults: 0,
          page,
          size,
          pageSize: size,
          totalPages: 0,
          searchWords: getQueryWords(search),
        });
      }
      queryConditions.push({ subjectId: { $in: matchedSubjectIds } });
    }

    // Topic filter
    if (topicsFilter.length > 0) {
      queryConditions.push({
        topic: {
          $in: topicsFilter.map(
            (t) => new RegExp(`^\\s*${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i")
          ),
        },
      });
    }

    const topicQuery = queryConditions.length > 1 ? { $and: queryConditions } : queryConditions[0];

    let finalTopics = [];
    let total = 0;

    if (search) {
      // ── SEARCH MODE: Relevance Scoring & Sorting (Like Study Materials) ──
      // Fetch matching candidate topics up to 300 for high performance
      const candidateTopics = await Topic.find(topicQuery)
        .sort({ timestamp: -1 })
        .limit(300)
        .lean();

      // Batch populate subjects and users in 2 queries instead of 2 * N queries
      const subjectIds = Array.from(
        new Set(candidateTopics.map((t) => t.subjectId).filter(Boolean).map(String))
      );
      const subjects = await Subject.find({ _id: { $in: subjectIds } }).lean();
      const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s]));

      const userIds = Array.from(
        new Set(
          candidateTopics
            .map((t) => t.userId || subjectMap.get(t.subjectId?.toString())?.userId)
            .filter(Boolean)
            .map(String)
        )
      );
      const users = await User.find({ _id: { $in: userIds } }).lean();
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const topicsWithDetails = candidateTopics.map((topic) => {
        const subject = subjectMap.get(topic.subjectId?.toString());
        const userId = topic.userId || subject?.userId;
        const user = userId ? userMap.get(userId.toString()) : null;

        return {
          ...topic,
          images: Array.isArray(topic.images) ? topic.images.slice(0, 2) : [],
          subject: subject ? subject.subject : null,
          subjectId: subject ? subject._id : null,
          userName: user ? user.name : null,
          usn: user ? user.usn : null,
          profileimg: user ? user.profileimg : null,
          userId: user ? user._id : null,
        };
      });

      // Score each topic by relevance (most matching on top)
      const scoredTopics = topicsWithDetails
        .map((t) => scoreAndTagTopic(t, search))
        .filter((t) => t.matchScore > 0);

      // Sort by match score descending; if equal, by timestamp
      scoredTopics.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        if (sortOrder === "oldest") {
          return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
        }
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      });

      total = scoredTopics.length;
      const paginatedTopics = scoredTopics.slice(skip, skip + size);

      // Record views for returned items
      const topicIds = paginatedTopics.map((t) => t._id);
      const viewsMap = await recordResourceViews(topicIds);

      finalTopics = paginatedTopics.map((t) => ({
        ...t,
        views: viewsMap[t._id.toString()] ?? 0,
      }));
    } else {
      // ── BROWSING MODE: Standard Date Sorting ──
      const sortOption = sortOrder === "oldest" ? { timestamp: 1, _id: 1 } : { timestamp: -1, _id: -1 };

      total = await Topic.countDocuments(topicQuery);
      const topics = await Topic.find(topicQuery)
        .sort(sortOption)
        .skip(skip)
        .limit(size)
        .lean();

      // Batch populate
      const subjectIds = Array.from(
        new Set(topics.map((t) => t.subjectId).filter(Boolean).map(String))
      );
      const subjects = await Subject.find({ _id: { $in: subjectIds } }).lean();
      const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s]));

      const userIds = Array.from(
        new Set(
          topics
            .map((t) => t.userId || subjectMap.get(t.subjectId?.toString())?.userId)
            .filter(Boolean)
            .map(String)
        )
      );
      const users = await User.find({ _id: { $in: userIds } }).lean();
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const topicIds = topics.map((t) => t._id);
      const viewsMap = await recordResourceViews(topicIds);

      finalTopics = topics.map((topic) => {
        const subject = subjectMap.get(topic.subjectId?.toString());
        const userId = topic.userId || subject?.userId;
        const user = userId ? userMap.get(userId.toString()) : null;

        return {
          ...topic,
          images: Array.isArray(topic.images) ? topic.images.slice(0, 2) : [],
          subject: subject ? subject.subject : null,
          subjectId: subject ? subject._id : null,
          userName: user ? user.name : null,
          usn: user ? user.usn : null,
          profileimg: user ? user.profileimg : null,
          userId: user ? user._id : null,
          views: viewsMap[topic._id.toString()] ?? 0,
          matchedIn: [],
          matchedKeywords: [],
        };
      });
    }

    // Metric tracking
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await RequestMetric.findOneAndUpdate(
        { datetime: today },
        { $inc: { works: 1 } },
        { upsert: true }
      );
    } catch (metricErr) {
      console.warn("Metric update skipped:", metricErr.message);
    }

    return NextResponse.json({
      topics: finalTopics,
      total,
      totalResults: total,
      page,
      size,
      pageSize: size,
      totalPages: Math.ceil(total / size),
      searchWords: getQueryWords(search),
    });
  } catch (err) {
    console.error("GET /api/resources error:", err);
    return NextResponse.json(
      { error: "Failed to fetch resources", details: err.message },
      { status: 500 }
    );
  }
}

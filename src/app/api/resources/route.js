import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import RequestMetric from "@/models/RequestMetric";
import { buildKeywordConditions } from "@/lib/searchHelper";
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
    if (search === '""' || search === "''" || search === '""') {
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

    const sortOption = sortOrder === "oldest" ? { timestamp: 1, _id: 1 } : { timestamp: -1, _id: -1 };

    const total = await Topic.countDocuments(topicQuery);
    const topics = await Topic.find(topicQuery)
      .sort(sortOption)
      .skip(skip)
      .limit(size)
      .lean();

    // Record and increment views atomically for the returned page
    const topicIds = topics.map((t) => t._id);
    const viewsMap = await recordResourceViews(topicIds);

    // Populate user and subject info
    const topicsWithDetails = await Promise.all(
      topics.map(async (topic) => {
        const subject = await Subject.findById(topic.subjectId).lean();
        const user = subject ? await User.findById(subject.userId).lean() : null;

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
        };
      })
    );

    // Metric tracking (same as before)
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
      topics: topicsWithDetails,
      total,
      totalResults: total,
      page,
      size,
      pageSize: size,
      totalPages: Math.ceil(total / size),
    });
  } catch (err) {
    console.error("GET /api/resources error:", err);
    return NextResponse.json(
      { error: "Failed to fetch resources", details: err.message },
      { status: 500 }
    );
  }
}

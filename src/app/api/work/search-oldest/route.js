import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { buildKeywordConditions } from "@/lib/searchHelper";

// GET /api/work/search-oldest?q=keyword&page=1&pageSize=8&subjects=sub1,sub2&topics=topic1,topic2
// Returns topics sorted by oldest first (ascending timestamp)
export const GET = async (req) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 8;
    const skip = (page - 1) * pageSize;

    // Trim every value to avoid whitespace / URL-encoding artifacts
    const subjectsFilter = (searchParams.get("subjects") || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const topicsFilter = (searchParams.get("topics") || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    // Build query conditions
    let queryConditions = [{ public: { $ne: false } }];

    // Keyword search — topic name, content, subject, username, USN, _id, date
    if (q) {
      const orConditions = await buildKeywordConditions(q);
      if (orConditions.length > 0) {
        queryConditions.push({ $or: orConditions });
      }
    }

    // Subject filter — exact case-insensitive match against trimmed names
    if (subjectsFilter.length > 0) {
      const matchedSubjects = await Subject.find({
        subject: { $in: subjectsFilter.map(s => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, "i")) }
      }).lean();
      const matchedSubjectIds = matchedSubjects.map(s => s._id);
      if (matchedSubjectIds.length === 0) {
        return NextResponse.json({ topics: [], total: 0, totalResults: 0, page, pageSize, totalPages: 0 });
      }
      queryConditions.push({ subjectId: { $in: matchedSubjectIds } });
    }

    // Topic filter — exact case-insensitive match against trimmed names
    if (topicsFilter.length > 0) {
      queryConditions.push({
        topic: { $in: topicsFilter.map(t => new RegExp(`^\\s*${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, "i")) }
      });
    }

    const topicQuery = { $and: queryConditions };
    const total = await Topic.countDocuments(topicQuery);

    // Sort by timestamp ASCENDING (oldest first)
    const topics = await Topic.find(topicQuery)
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // For each topic, get subject and user
    const topicsWithDetails = await Promise.all(
      topics.map(async (topic) => {
        const subject = await Subject.findById(topic.subjectId).lean();
        const user = subject ? await User.findById(subject.userId).lean() : null;
        return {
          ...topic,
          subject: subject ? subject.subject : null,
          subjectId: subject ? subject._id : null,
          userName: user ? user.name : null,
          usn: user ? user.usn : null,
          profileimg: user ? user.profileimg : null,
          userId: user ? user._id : null,
        };
      })
    );

    return NextResponse.json({
      topics: topicsWithDetails,
      total,
      totalResults: total,   // explicit alias used by the frontend for the count display
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to search topics", details: err.message }, { status: 500 });
  }
};

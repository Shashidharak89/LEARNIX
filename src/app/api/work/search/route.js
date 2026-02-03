import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

// GET /api/work/search?q=keyword&page=1&pageSize=8&subjects=sub1,sub2&topics=topic1,topic2
export const GET = async (req) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 8;
    const skip = (page - 1) * pageSize;
    
    // Get subjects and topics filters (comma-separated)
    const subjectsFilter = searchParams.get("subjects")?.split(",").filter(s => s.trim()) || [];
    const topicsFilter = searchParams.get("topics")?.split(",").filter(t => t.trim()) || [];

    // Build query conditions
    let queryConditions = [{ public: { $ne: false } }];

    // Keyword search condition
    if (q) {
      const subjects = await Subject.find({ subject: { $regex: q, $options: "i" } }).lean();
      const subjectIds = subjects.map(s => s._id);
      queryConditions.push({
        $or: [
          { topic: { $regex: q, $options: "i" } },
          { content: { $regex: q, $options: "i" } },
          { subjectId: { $in: subjectIds } }
        ]
      });
    }

    // Subject filter condition - match any of the selected subjects
    if (subjectsFilter.length > 0) {
      const matchedSubjects = await Subject.find({ 
        subject: { $in: subjectsFilter.map(s => new RegExp(`^${s}$`, 'i')) }
      }).lean();
      const matchedSubjectIds = matchedSubjects.map(s => s._id);
      if (matchedSubjectIds.length > 0) {
        queryConditions.push({ subjectId: { $in: matchedSubjectIds } });
      } else {
        // No matching subjects found, return empty
        return NextResponse.json({ topics: [], total: 0, page, pageSize, totalPages: 0 });
      }
    }

    // Topic filter condition - match any of the selected topics
    if (topicsFilter.length > 0) {
      queryConditions.push({ 
        topic: { $in: topicsFilter.map(t => new RegExp(`^${t}$`, 'i')) }
      });
    }

    const topicQuery = { $and: queryConditions };
    const total = await Topic.countDocuments(topicQuery);
    const topics = await Topic.find(topicQuery)
      .sort({ timestamp: -1 })
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
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to search topics", details: err.message }, { status: 500 });
  }
};

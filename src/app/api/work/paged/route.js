import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

// GET /api/work/paged?page=1&pageSize=8
export const GET = async (req) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 8;
    const skip = (page - 1) * pageSize;

    // Find all public topics, sorted by timestamp desc
    const topics = await Topic.find({ public: { $ne: false } })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Get total count for pagination
    const total = await Topic.countDocuments({ public: { $ne: false } });

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
    return NextResponse.json({ error: "Failed to fetch topics", details: err.message }, { status: 500 });
  }
};

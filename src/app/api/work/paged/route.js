import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import RequestMetric from "@/models/RequestMetric";
import { resolveAuthenticatedUser } from "@/lib/authUser";

// GET /api/work/paged?page=1&pageSize=8
export const GET = async (req) => {
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
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 8;
    const skip = (page - 1) * pageSize;

    const topics = await Topic.find({
      $or: [
        { visibility: "public" },
        { visibility: { $exists: false } }
      ]
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total = await Topic.countDocuments({
      $or: [
        { visibility: "public" },
        { visibility: { $exists: false } }
      ]
    });

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

    // METRIC TRACKING
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await RequestMetric.findOneAndUpdate(
        { datetime: today },
        { $inc: { works: 1 } },
        { upsert: true }
      );
    } catch (err) {
      console.error("Metric update failed:", err.message);
    }

    return NextResponse.json({
      topics: topicsWithDetails,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch topics", details: err.message },
      { status: 500 }
    );
  }
};
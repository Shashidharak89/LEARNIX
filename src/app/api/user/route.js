// api/user/get-user/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export const GET = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const usnParam = searchParams.get("usn");

    if (!usnParam) {
      return NextResponse.json(
        { error: "USN is required" },
        { status: 400 }
      );
    }

    const usn = usnParam.trim().toUpperCase();

    // Case-insensitive search
    const user = await User.findOne({
      usn: { $regex: new RegExp(`^${usn}$`, "i") }
    }).lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch subjects for this user
    const subjects = await Subject.find({ userId: user._id }).lean();
    
    // Fetch topics for each subject
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (subject) => {
        const topics = await Topic.find({ subjectId: subject._id }).lean();
        return {
          _id: subject._id,
          subject: subject.subject,
          public: subject.public,
          topics: topics.map(t => ({
            _id: t._id,
            topic: t.topic,
            content: t.content,
            images: t.images,
            public: t.public,
            timestamp: t.timestamp
          }))
        };
      })
    );

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        usn: user.usn,
        subjects: subjectsWithTopics,
        createdAt: user.createdAt,
        profileimg: user.profileimg,
        // Active is deprecated; return dummy value for compatibility
        active: user.active ?? 0,
      },
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch user details",
        details: err.message,
      },
      { status: 500 }
    );
  }
};

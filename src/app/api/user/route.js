// api/user/route.js
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
    const includeUploads = searchParams.get("includeUploads") === "true";

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

    let subjectsWithTopics = [];
    let subjectsCount = 0;

    if (includeUploads) {
      // Fetch subjects for this user
      const subjects = await Subject.find({ userId: user._id }).lean();
      subjectsCount = subjects.length;

      // Fetch topics for each subject
      subjectsWithTopics = await Promise.all(
        subjects.map(async (subject) => {
          const topics = await Topic.find({ subjectId: subject._id }).lean();
          return {
            _id: subject._id,
            subject: subject.subject,
            visibility: subject.visibility || "public",
            topics: topics.map(t => ({
              _id: t._id,
              topic: t.topic,
              content: t.content,
              images: t.images,
              visibility: t.visibility || "public",
              timestamp: t.timestamp
            }))
          };
        })
      );
    } else {
      subjectsCount = await Subject.countDocuments({ userId: user._id });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        usn: user.usn,
        email: user.email || "",
        subjects: subjectsWithTopics,
        subjectsCount,
        hasUploadsLoaded: includeUploads,
        createdAt: user.createdAt,
        profileimg: user.profileimg,
        streaks: Number.isFinite(Number(user.streaks)) ? Number(user.streaks) : 1,
        highestStreak: Number.isFinite(Number(user.highestStreak)) ? Number(user.highestStreak) : 1,
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

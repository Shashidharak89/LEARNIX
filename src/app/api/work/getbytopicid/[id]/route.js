import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

// GET /api/work/getbytopicid/:id
export const GET = async (req, { params }) => {
  try {
    await connectDB();

    const { id } = await params; // topic _id

    // Find the topic
    const topic = await Topic.findById(id);

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Find the user
    const user = await User.findById(topic.userId).lean();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find the subject
    const subject = await Subject.findById(topic.subjectId).lean();
    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        usn: user.usn,
        profileimg: user.profileimg,
      },
      subject: {
        subject: subject.subject,
      },
      topic: {
        _id: topic._id,
        topic: topic.topic,
        content: topic.content,
        images: topic.images,
        public: topic.public,
        timestamp: topic.timestamp
      },
    });
  } catch (err) {
    console.error("Error in getbytopicid:", err);
    return NextResponse.json(
      { error: "Failed to fetch topic", details: err.message },
      { status: 500 }
    );
  }
};

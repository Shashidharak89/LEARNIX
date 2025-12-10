import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export const DELETE = async (req) => {
  try {
    await connectDB();
    const { usn, subject, topic } = await req.json();

    if (!usn || !subject || !topic) {
      return NextResponse.json(
        { error: "USN, subject and topic are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sub = await Subject.findOne({ userId: user._id, subject });
    if (!sub) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Delete the topic
    const result = await Topic.deleteOne({ 
      userId: user._id, 
      subjectId: sub._id, 
      topic 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Fetch all subjects with topics for response
    const subjects = await Subject.find({ userId: user._id }).lean();
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (s) => {
        const topics = await Topic.find({ subjectId: s._id }).lean();
        return {
          _id: s._id,
          subject: s.subject,
          public: s.public,
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
      message: "Topic deleted successfully",
      subjects: subjectsWithTopics,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete topic", details: err.message },
      { status: 500 }
    );
  }
};

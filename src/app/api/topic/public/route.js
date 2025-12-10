import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export async function PUT(req) {
  try {
    await connectDB();
    const { usn, subject: subjectName, topic: topicName, public: isPublic } = await req.json();

    if (!usn || !subjectName || !topicName) {
      return NextResponse.json({ error: "USN, subject, and topic are required" }, { status: 400 });
    }

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subject = await Subject.findOne({ userId: user._id, subject: subjectName });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const topic = await Topic.findOne({ 
      userId: user._id, 
      subjectId: subject._id, 
      topic: topicName 
    });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Update topic public flag
    topic.public = typeof isPublic === "boolean" ? isPublic : false;
    await topic.save();

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

    return NextResponse.json({ message: "Topic visibility updated", subjects: subjectsWithTopics });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
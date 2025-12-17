import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export async function PUT(req) {
  try {
    await connectDB();

    const { usn, topicId, newTopic } = await req.json();

    if (!usn || !topicId || !newTopic) {
      return NextResponse.json(
        { error: "USN, topicId, and newTopic are required" },
        { status: 400 }
      );
    }

    const cleaned = String(newTopic).trim();
    if (!cleaned) {
      return NextResponse.json({ error: "New topic name is required" }, { status: 400 });
    }

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const topicDoc = await Topic.findOne({ _id: topicId, userId: user._id });
    if (!topicDoc) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Prevent duplicates within the same subject for this user (case-insensitive exact match)
    const dupe = await Topic.findOne({
      _id: { $ne: topicDoc._id },
      userId: user._id,
      subjectId: topicDoc.subjectId,
      topic: { $regex: `^${cleaned.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")}$`, $options: "i" },
    }).lean();

    if (dupe) {
      return NextResponse.json(
        { error: "A topic with this name already exists in this subject" },
        { status: 409 }
      );
    }

    topicDoc.topic = cleaned;
    await topicDoc.save();

    // Return subjects list (same pattern as other topic endpoints)
    const subjects = await Subject.find({ userId: user._id }).lean();
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (s) => {
        const topics = await Topic.find({ subjectId: s._id }).lean();
        return {
          _id: s._id,
          subject: s.subject,
          public: s.public,
          topics: topics.map((t) => ({
            _id: t._id,
            topic: t.topic,
            content: t.content,
            images: t.images,
            public: t.public,
            timestamp: t.timestamp,
          })),
        };
      })
    );

    return NextResponse.json({ message: "Topic renamed successfully", subjects: subjectsWithTopics });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to rename topic", details: error.message },
      { status: 500 }
    );
  }
}

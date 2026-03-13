import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { normalizeVisibility } from "@/lib/visibility";

export async function PUT(req) {
  try {
    await connectDB();
    const { usn, topicId, subject: subjectName, topic: topicName, visibility } = await req.json();

    if (!usn || (!topicId && (!subjectName || !topicName))) {
      return NextResponse.json({ error: "USN and topicId (or subject + topic) are required" }, { status: 400 });
    }

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let topic = null;
    if (topicId) {
      topic = await Topic.findOne({ _id: topicId, userId: user._id });
    } else {
      const subject = await Subject.findOne({ userId: user._id, subject: subjectName });
      if (!subject) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      }
      topic = await Topic.findOne({ 
        userId: user._id, 
        subjectId: subject._id, 
        topic: topicName 
      });
    }

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Update topic visibility
    topic.visibility = normalizeVisibility(visibility);
    await topic.save();

    // Fetch all subjects with topics for response
    const subjects = await Subject.find({ userId: user._id }).lean();
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (s) => {
        const topics = await Topic.find({ subjectId: s._id }).lean();
        return {
          _id: s._id,
          subject: s.subject,
          visibility: s.visibility || "public",
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

    return NextResponse.json({ message: "Topic visibility updated", subjects: subjectsWithTopics });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
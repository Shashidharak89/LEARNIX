import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, subject, topic, content, images, public: isPublic } = await req.json();

    if (!usn || !subject || !topic) {
      return NextResponse.json({ error: "USN, subject, and topic are required" }, { status: 400 });
    }

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the subject for this user
    const subj = await Subject.findOne({ userId: user._id, subject });
    if (!subj) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Create new topic
    await Topic.create({
      userId: user._id,
      subjectId: subj._id,
      topic,
      content: content || "",
      images: images || [],
      public: typeof isPublic === "boolean" ? isPublic : true,
      timestamp: new Date()
    });

    // Fetch all subjects with topics for response (to maintain compatibility)
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

    return NextResponse.json({ message: "Topic added successfully", subjects: subjectsWithTopics });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

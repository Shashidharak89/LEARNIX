import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export async function PUT(req) {
  try {
    await connectDB();
    const { usn, subject: subjectName, topic: topicName, public: isPublic } = await req.json();

    if (!usn || !subjectName || !topicName) {
      return NextResponse.json({ error: "USN, subject, and topic are required" }, { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subject = user.subjects.find(s => s.subject === subjectName);
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const topic = subject.topics.find(t => t.topic === topicName);
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Update topic public flag
    topic.public = typeof isPublic === "boolean" ? isPublic : false;

    await user.save();

    return NextResponse.json({ message: "Topic visibility updated", subjects: user.subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
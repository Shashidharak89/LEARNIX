import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export async function PUT(req) {
  try {
    await connectDB();
    const { usn, subjectId, topicId, public: isPublic } = await req.json();

    if (!usn || !subjectId || !topicId) {
      return NextResponse.json({ error: "USN, subjectId, and topicId are required" }, { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subject = user.subjects.id(subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const topic = subject.topics.id(topicId);
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Update topic public flag
    topic.public = typeof isPublic === "boolean" ? isPublic : true;

    await user.save();

    return NextResponse.json({ message: "Topic visibility updated", subjects: user.subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

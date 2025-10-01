import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, subject, topic, content, images, public: isPublic } = await req.json();

    if (!usn || !subject || !topic) {
      return NextResponse.json({ error: "USN, subject, and topic are required" }, { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the subject
    const subj = user.subjects.find((s) => s.subject === subject);
    if (!subj) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Add topic (default public = true if not given)
    subj.topics.push({
      topic,
      content: content || "",
      images: images || [],
      timestamp: new Date(),
      public: typeof isPublic === "boolean" ? isPublic : true
    });

    await user.save();

    return NextResponse.json({ message: "Topic added successfully", subjects: user.subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

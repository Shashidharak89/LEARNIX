import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { normalizeVisibility } from "@/lib/visibility";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export async function POST(req) {
  try {
    await connectDB();
    const { subject: rawSubject, topic: rawTopic, content, images, visibility } = await req.json();
    const subject = rawSubject?.trim();
    const topic = rawTopic?.trim();

    if (!subject || !topic) {
      return NextResponse.json({ error: "Subject and topic are required" }, { status: 400 });
    }

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!auth.user) {
      return NextResponse.json({ error: "Authentication required. Please log in." }, { status: 401 });
    }

    const subj = await Subject.findOne({ userId: auth.user._id, subject });
    if (!subj) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Create new topic
    const created = await Topic.create({
      userId: auth.user._id,
      subjectId: subj._id,
      topic,
      content: content || "",
      images: images || [],
      visibility: normalizeVisibility(visibility),
      timestamp: new Date()
    });

    return NextResponse.json({ message: "Topic added successfully", topicId: created._id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

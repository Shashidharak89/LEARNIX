import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const authUser = await resolveAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }

    const subject = await Subject.findById(subjectId).lean();

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const isOwner = Boolean(authUser && authUser._id.toString() === subject.userId.toString());

    // If subject is private and viewer is not owner, deny access
    if (subject.visibility === "private" && !isOwner) {
      return NextResponse.json({ error: "Access denied to private subject" }, { status: 403 });
    }

    const topicQuery = { subjectId: subject._id };
    if (!isOwner) {
      topicQuery.$or = [{ visibility: "public" }, { visibility: { $exists: false } }];
    }

    const topics = await Topic.find(topicQuery)
      .sort({ timestamp: -1 })
      .lean();

    const formattedTopics = topics.map((t) => ({
      _id: t._id.toString(),
      topic: t.topic,
      content: t.content || "",
      visibility: t.visibility || "public",
      timestamp: t.timestamp
    }));

    return NextResponse.json({
      success: true,
      subjectId: subject._id.toString(),
      subjectName: subject.subject,
      topics: formattedTopics,
      count: formattedTopics.length
    });
  } catch (error) {
    console.error("Error fetching subject topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics", details: error.message },
      { status: 500 }
    );
  }
}

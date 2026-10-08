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
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized. Valid authentication token required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }

    // Verify subject belongs to user
    const subject = await Subject.findOne({
      _id: subjectId,
      userId: authUser._id
    }).lean();

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const topics = await Topic.find({
      subjectId,
      userId: authUser._id
    })
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
      subjectId,
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

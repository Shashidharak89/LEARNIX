import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import { normalizeVisibility } from "@/lib/visibility";
import { resolveAuthenticatedUser } from "@/lib/authUser";

const VISIBILITIES = new Set(["public", "unlisted", "private"]);

export async function PUT(request) {
  try {
    await connectDB();
    const auth = await resolveAuthenticatedUser(request, { withMeta: true });
    if (!auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { topicId, visibility } = await request.json();
    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      return NextResponse.json({ error: "A valid topicId is required." }, { status: 400 });
    }
    if (!VISIBILITIES.has(visibility)) {
      return NextResponse.json({ error: "Visibility must be public, unlisted, or private." }, { status: 400 });
    }

    const topic = await Topic.findOneAndUpdate(
      { _id: topicId, userId: auth.user._id },
      { $set: { visibility: normalizeVisibility(visibility) } },
      { new: true, runValidators: true }
    ).select("_id visibility").lean();

    if (!topic) return NextResponse.json({ error: "Topic not found." }, { status: 404 });
    return NextResponse.json({ topicId: topic._id, visibility: topic.visibility || "public" });
  } catch (error) {
    console.error("PUT /api/topic/visibility error:", error);
    return NextResponse.json({ error: "Failed to update topic visibility." }, { status: 500 });
  }
}

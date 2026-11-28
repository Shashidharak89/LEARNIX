import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
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

    const { subjectId, visibility } = await request.json();
    if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
      return NextResponse.json({ error: "A valid subjectId is required." }, { status: 400 });
    }
    if (!VISIBILITIES.has(visibility)) {
      return NextResponse.json({ error: "Visibility must be public, unlisted, or private." }, { status: 400 });
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: subjectId, userId: auth.user._id },
      { $set: { visibility: normalizeVisibility(visibility) } },
      { new: true, runValidators: true }
    ).select("_id visibility").lean();

    if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    return NextResponse.json({ subjectId: subject._id, visibility: subject.visibility || "public" });
  } catch (error) {
    console.error("PUT /api/subject/visibility error:", error);
    return NextResponse.json({ error: "Failed to update subject visibility." }, { status: 500 });
  }
}

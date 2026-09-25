import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import User from "@/models/User";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const updateId = resolvedParams?.updateId;

    if (!updateId || !mongoose.Types.ObjectId.isValid(updateId)) {
      return NextResponse.json({ error: "Invalid or missing update ID" }, { status: 400 });
    }

    const updateDoc = await Update.findById(updateId).lean();
    if (!updateDoc) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    // Resolve caller from Authorization header
    const authResult = await resolveAuthenticatedUser(req, { withMeta: true });
    const caller = authResult?.user || null;
    const isOwner = caller && updateDoc.userId && caller._id.toString() === updateDoc.userId.toString();
    const isAdmin = caller && (caller.role === "admin" || caller.role === "superadmin");

    const visibility = updateDoc.visibility || "public";
    const isPublic = visibility === "public";
    const isUnlisted = visibility === "unlisted";

    // Permission logic:
    // - Public & Unlisted: Anyone can view (even without auth header)
    // - Private: Only owner or admin can view
    if (!isPublic && !isUnlisted && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "This update is private and can only be viewed by its author." },
        { status: 403 }
      );
    }

    // Fetch author user details
    let author = null;
    if (updateDoc.userId) {
      author = await User.findById(updateDoc.userId).lean();
    }

    const enriched = {
      _id: updateDoc._id,
      title: updateDoc.title,
      content: updateDoc.content,
      links: updateDoc.links || [],
      files: updateDoc.files || [],
      userId: updateDoc.userId,
      visibility: updateDoc.visibility || "public",
      createdAt: updateDoc.createdAt,
      updatedAt: updateDoc.updatedAt,
      usn: author?.usn || null,
      name: author?.name || null,
      profileUrl: author?.profileimg || null,
      isOwner: Boolean(isOwner),
    };

    return NextResponse.json({ success: true, update: enriched }, { status: 200 });
  } catch (error) {
    console.error("GET /api/updates/[updateId] error:", error);
    return NextResponse.json({ error: "Failed to fetch update details" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const updateId = resolvedParams?.updateId;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const update = await Update.findById(updateId);
    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // Only the creator of the update can delete it
    if (!update.userId) {
      return NextResponse.json({ error: 'This update cannot be deleted by users' }, { status: 403 });
    }

    if (update.userId.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'You are not authorized to delete this update' }, { status: 403 });
    }

    await Update.findByIdAndDelete(updateId);

    return NextResponse.json({ message: 'Update deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/updates/[updateId] error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

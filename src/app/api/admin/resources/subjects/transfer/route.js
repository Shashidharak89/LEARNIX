import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import User from "@/models/User";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";

// POST /api/admin/resources/subjects/transfer
// Body: { subjectId: string, targetUsn: string }
export async function POST(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const body = await req.json().catch(() => ({}));
    const { subjectId, targetUsn } = body;

    if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
      return NextResponse.json(
        { error: "Valid subjectId is required." },
        { status: 400 }
      );
    }

    if (!targetUsn || typeof targetUsn !== "string" || !targetUsn.trim()) {
      return NextResponse.json(
        { error: "Target USN is required to transfer the subject." },
        { status: 400 }
      );
    }

    const cleanUsn = targetUsn.trim().toUpperCase();

    // 1. Look up target user by USN
    const targetUser = await User.findOne({ usn: cleanUsn });
    if (!targetUser) {
      return NextResponse.json(
        { error: `Target user with USN "${cleanUsn}" not found. Please verify the USN.` },
        { status: 404 }
      );
    }

    // 2. Look up the subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found." },
        { status: 404 }
      );
    }

    // 3. Check if already owned by target user
    if (subject.userId.toString() === targetUser._id.toString()) {
      return NextResponse.json(
        {
          error: `Subject "${subject.subject}" is already assigned to this user (${targetUser.name} - ${targetUser.usn}).`,
        },
        { status: 400 }
      );
    }

    // 4. Fetch previous user details for audit information
    const previousUser = await User.findById(subject.userId)
      .select("_id name usn email profileimg")
      .lean();

    // 5. Transfer Subject to target user
    subject.userId = targetUser._id;
    await subject.save();

    // 6. Transfer all topics under this subject to target user
    // Topics are tightly coupled to the subject, so transferring the subject cascades to its topics.
    const topicUpdateResult = await Topic.updateMany(
      { subjectId: subject._id },
      { $set: { userId: targetUser._id } }
    );

    return NextResponse.json({
      success: true,
      message: `Subject "${subject.subject}" and ${topicUpdateResult.modifiedCount} topic(s) successfully transferred to ${targetUser.name} (${targetUser.usn}).`,
      subject: {
        _id: subject._id,
        subject: subject.subject,
        userId: targetUser._id,
      },
      transferredTopicsCount: topicUpdateResult.modifiedCount,
      previousUser: previousUser
        ? {
            _id: previousUser._id,
            name: previousUser.name,
            usn: previousUser.usn,
          }
        : null,
      targetUser: {
        _id: targetUser._id,
        name: targetUser.name,
        usn: targetUser.usn,
      },
    });
  } catch (err) {
    console.error("POST /api/admin/resources/subjects/transfer error:", err);
    return NextResponse.json(
      { error: "Failed to transfer subject", details: err.message },
      { status: 500 }
    );
  }
}

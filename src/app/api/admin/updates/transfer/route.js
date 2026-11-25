import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import Update from "@/models/Update";
import User from "@/models/User";
import mongoose from "mongoose";

export async function PATCH(req) {
  try {
    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    await connectDB();
    const { updateId, newUserId } = await req.json();

    if (!updateId || !mongoose.Types.ObjectId.isValid(updateId)) {
      return NextResponse.json({ error: "Valid updateId is required" }, { status: 400 });
    }
    if (!newUserId || !mongoose.Types.ObjectId.isValid(newUserId)) {
      return NextResponse.json({ error: "Valid newUserId is required" }, { status: 400 });
    }

    const targetUser = await User.findById(newUserId).select("name usn profileimg").lean();
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const updated = await Update.findByIdAndUpdate(
      updateId,
      { userId: targetUser._id },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Ownership transferred to ${targetUser.name || targetUser.usn}`,
      update: {
        ...updated,
        userId: targetUser._id,
        name: targetUser.name,
        usn: targetUser.usn,
        profileUrl: targetUser.profileimg || null,
      },
    });
  } catch (err) {
    console.error("PATCH /api/admin/updates/transfer error:", err);
    return NextResponse.json({ error: "Failed to transfer ownership" }, { status: 500 });
  }
}


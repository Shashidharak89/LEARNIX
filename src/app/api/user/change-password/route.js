import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const PUT = async (req) => {
  try {
    await connectDB();
    const { usn, oldPassword, newPassword } = await req.json();

    if (!usn || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "USN, old password, and new password are required" },
        { status: 400 }
      );
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has no password set yet
    if (!user.password) {
      return NextResponse.json(
        { error: "Password not set yet for this user" },
        { status: 400 }
      );
    }

    // Verify old password
    if (user.password !== oldPassword) {
      return NextResponse.json(
        { error: "Incorrect old password" },
        { status: 401 }
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return NextResponse.json({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update password", details: err.message },
      { status: 500 }
    );
  }
};

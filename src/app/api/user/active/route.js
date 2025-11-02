import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const POST = async (req) => {
  try {
    await connectDB();

    const { usn } = await req.json();

    if (!usn) {
      return NextResponse.json(
        { error: "USN is required" },
        { status: 400 }
      );
    }

    const user = await Work.findOneAndUpdate(
      { usn: usn.trim().toUpperCase() },
      { $inc: { active: 1 } }, // Increment active time by 1 minute
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      active: user.active
    });
  } catch (err) {
    console.error("Error updating active time:", err);
    return NextResponse.json(
      {
        error: "Failed to update active time",
        details: err.message,
      },
      { status: 500 }
    );
  }
};

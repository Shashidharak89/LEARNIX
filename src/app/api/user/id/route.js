// api/user/id/route.js - Lightweight endpoint to get user ID by USN
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const GET = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const usnParam = searchParams.get("usn");

    if (!usnParam) {
      return NextResponse.json(
        { error: "USN is required" },
        { status: 400 }
      );
    }

    const usn = usnParam.trim().toUpperCase();

    // Case-insensitive search - only fetch _id field
    const user = await User.findOne({
      usn: { $regex: new RegExp(`^${usn}$`, "i") }
    }).select("_id").lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: user._id,
    });
  } catch (err) {
    console.error("Error fetching user ID:", err);
    return NextResponse.json(
      { error: "Failed to fetch user ID", details: err.message },
      { status: 500 }
    );
  }
};

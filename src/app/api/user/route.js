// api/user/get-user/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

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

    // Case-insensitive search
    const user = await Work.findOne({
      usn: { $regex: new RegExp(`^${usn}$`, "i") }
    }).lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        usn: user.usn,
        subjects: user.subjects || [],
        createdAt: user.createdAt,
        profileimg: user.profileimg,
        active: user.active || 0,
      },
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch user details",
        details: err.message,
      },
      { status: 500 }
    );
  }
};

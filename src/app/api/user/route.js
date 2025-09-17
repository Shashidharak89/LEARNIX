import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

const DEFAULT_PROFILE_IMG =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export const GET = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const usnParam = searchParams.get("usn");

    if (!usnParam) {
      return NextResponse.json({ error: "USN is required" }, { status: 400 });
    }

    const usn = usnParam.toUpperCase();
    const user = await Work.findOne({ usn });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return cleaned user object but keep _id as id
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        usn: user.usn,
        subjects: user.subjects,
        createdAt: user.createdAt,
        profileimg: user.profileimg || DEFAULT_PROFILE_IMG,
      },
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    return NextResponse.json(
      { error: "Failed to fetch user details", details: err.message },
      { status: 500 }
    );
  }
};

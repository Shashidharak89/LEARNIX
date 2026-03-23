import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import { normalizeVisibility } from "@/lib/visibility";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, subject: rawSubject, visibility } = await req.json();
    const subject = rawSubject?.trim();

    if (!usn || !subject) {
      return NextResponse.json({ error: "USN and subject are required" }, { status: 400 });
    }

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create new subject for this user
    await Subject.create({
      userId: user._id,
      subject,
      visibility: normalizeVisibility(visibility)
    });

    // Fetch all subjects for response (to maintain compatibility)
    const subjects = await Subject.find({ userId: user._id }).lean();

    return NextResponse.json({ message: "Subject added successfully", subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

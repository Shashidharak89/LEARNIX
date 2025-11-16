import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const DELETE = async (req) => {
  try {
    await connectDB();
    const { usn, subject } = await req.json();

    if (!usn || !subject) {
      return NextResponse.json(
        { error: "USN and subject are required" },
        { status: 400 }
      );
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Filter out the subject
    const initialLength = user.subjects.length;
    user.subjects = user.subjects.filter((s) => s.subject !== subject);

    if (user.subjects.length === initialLength) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    await user.save();

    return NextResponse.json({
      message: "Subject deleted successfully",
      subjects: user.subjects,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete subject", details: err.message },
      { status: 500 }
    );
  }
};

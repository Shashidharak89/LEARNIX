import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

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

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find and delete the subject
    const subjectDoc = await Subject.findOne({ userId: user._id, subject });
    if (!subjectDoc) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Delete all topics related to this subject
    await Topic.deleteMany({ subjectId: subjectDoc._id });

    // Delete the subject
    await Subject.deleteOne({ _id: subjectDoc._id });

    // Fetch remaining subjects for response
    const subjects = await Subject.find({ userId: user._id }).lean();

    return NextResponse.json({
      message: "Subject deleted successfully",
      subjects,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete subject", details: err.message },
      { status: 500 }
    );
  }
};

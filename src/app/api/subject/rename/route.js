import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";

export async function PUT(req) {
  try {
    await connectDB();
    const { usn, subjectId, newSubject } = await req.json();

    if (!usn || !subjectId || !newSubject) {
      return NextResponse.json(
        { error: "USN, subjectId and newSubject are required" },
        { status: 400 }
      );
    }

    const trimmed = String(newSubject).trim();
    if (trimmed.length < 2) {
      return NextResponse.json(
        { error: "Subject name is too short" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ usn: String(usn).toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subjectDoc = await Subject.findOne({ _id: subjectId, userId: user._id });
    if (!subjectDoc) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Prevent duplicates for the same user (case-insensitive)
    const duplicate = await Subject.findOne({
      userId: user._id,
      _id: { $ne: subjectDoc._id },
      subject: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i") }
    }).lean();

    if (duplicate) {
      return NextResponse.json(
        { error: "You already have a subject with this name" },
        { status: 409 }
      );
    }

    subjectDoc.subject = trimmed;
    await subjectDoc.save();

    const subjects = await Subject.find({ userId: user._id }).lean();

    return NextResponse.json({ message: "Subject renamed successfully", subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

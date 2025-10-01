import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export async function PUT(req) {
  try {
    await connectDB();
    const { usn, subjectId, public: isPublic } = await req.json();

    if (!usn || !subjectId) {
      return NextResponse.json({ error: "USN and subjectId are required" }, { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subject = user.subjects.id(subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Update subject public flag
    subject.public = typeof isPublic === "boolean" ? isPublic : true;

    await user.save();

    return NextResponse.json({ message: "Subject visibility updated", subjects: user.subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, subject } = await req.json();

    if (!usn || !subject) {
      return NextResponse.json({ error: "USN and subject are required" }, { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Add new subject
    user.subjects.push({ subject, topics: [] });
    await user.save();

    return NextResponse.json({ message: "Subject added successfully", subjects: user.subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

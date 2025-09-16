import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const DELETE = async (req) => {
  try {
    await connectDB();
    const { usn, subject, topic } = await req.json();

    if (!usn || !subject || !topic) {
      return NextResponse.json(
        { error: "USN, subject and topic are required" },
        { status: 400 }
      );
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sub = user.subjects.find((s) => s.subject === subject);
    if (!sub) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const initialLength = sub.topics.length;
    sub.topics = sub.topics.filter((t) => t.topic !== topic);

    if (sub.topics.length === initialLength) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    await user.save();

    return NextResponse.json({
      message: "Topic deleted successfully",
      subjects: user.subjects,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete topic", details: err.message },
      { status: 500 }
    );
  }
};

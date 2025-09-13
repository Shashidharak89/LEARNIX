import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export async function PUT(req) {
  try {
    await connectDB();
    const { usn, subject, topic, images } = await req.json();

    if (!usn || !subject || !topic || !images || !Array.isArray(images)) {
      return NextResponse.json({ error: "USN, subject, topic, and images array are required" }, { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the subject
    const subj = user.subjects.find((s) => s.subject === subject);
    if (!subj) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Find the topic
    const t = subj.topics.find((tp) => tp.topic === topic);
    if (!t) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Append new images
    t.images.push(...images);

    await user.save();

    return NextResponse.json({ message: "Images added successfully", subjects: user.subjects });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

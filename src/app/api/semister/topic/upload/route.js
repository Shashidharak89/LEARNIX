// app/api/semester/topic/upload/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import cloudinary from "@/lib/cloudinary"; // Assuming you have cloudinary setup

export async function POST(req) {
  try {
    await connectDB();
    const formData = await req.formData();
    const usn = formData.get("usn");
    const semester = formData.get("semester");
    const subject = formData.get("subject");
    const topic = formData.get("topic");
    const file = formData.get("file");

    if (!usn || !semester || !subject || !topic || !file) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Upload to cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // Update Work model
    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetSemester = user.semesters.find(s => s.semester === semester);
    if (!targetSemester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    const targetSubject = targetSemester.subjects.find(s => s.subject === subject);
    if (!targetSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const targetTopic = targetSubject.topics.find(t => t.topic === topic);
    if (!targetTopic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    targetTopic.images.push(uploadResponse.secure_url);
    await user.save();

    return NextResponse.json({ 
      message: "Image uploaded successfully",
      semesters: user.semesters
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
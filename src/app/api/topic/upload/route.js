import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import cloudinary from "@/lib/cloudinary";

export const POST = async (req) => {
  try {
    await connectDB();

    const formData = await req.formData();
    const usn = formData.get("usn")?.toUpperCase();
    const subject = formData.get("subject");
    const topic = formData.get("topic");
    const file = formData.get("file");

    if (!usn || !subject || !topic || !file) {
      return NextResponse.json({ error: "USN, subject, topic, and file are required" }, { status: 400 });
    }

    const user = await Work.findOne({ usn });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const subj = user.subjects.find((s) => s.subject === subject);
    if (!subj) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const tp = subj.topics.find((t) => t.topic === topic);
    if (!tp) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `users/${usn}/${subject}/${topic}` },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer); // send the buffer to Cloudinary
    });

    // Save uploaded image URL
    tp.images.push(uploadResult.secure_url);
    await user.save();

    return NextResponse.json({
      message: "Image uploaded successfully",
      imageUrl: uploadResult.secure_url,
      subjects: user.subjects
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed: " + err.message }, { status: 500 });
  }
};

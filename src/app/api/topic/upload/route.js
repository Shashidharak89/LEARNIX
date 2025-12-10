import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
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

    const user = await User.findOne({ usn });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const subj = await Subject.findOne({ userId: user._id, subject });
    if (!subj) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const tp = await Topic.findOne({ userId: user._id, subjectId: subj._id, topic });
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
    await tp.save();

    // Fetch all subjects with topics for response
    const subjects = await Subject.find({ userId: user._id }).lean();
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (s) => {
        const topics = await Topic.find({ subjectId: s._id }).lean();
        return {
          _id: s._id,
          subject: s.subject,
          public: s.public,
          topics: topics.map(t => ({
            _id: t._id,
            topic: t.topic,
            content: t.content,
            images: t.images,
            public: t.public,
            timestamp: t.timestamp
          }))
        };
      })
    );

    return NextResponse.json({
      message: "Image uploaded successfully",
      imageUrl: uploadResult.secure_url,
      subjects: subjectsWithTopics
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed: " + err.message }, { status: 500 });
  }
};

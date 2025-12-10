import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import cloudinary from "@/lib/cloudinary";

export const PUT = async (req) => {
  try {
    await connectDB();
    const { usn, subject, topic, imageUrl } = await req.json();

    if (!usn || !subject || !topic || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const sub = await Subject.findOne({ userId: user._id, subject });
    if (!sub) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const t = await Topic.findOne({ userId: user._id, subjectId: sub._id, topic });
    if (!t) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    // Delete image from Cloudinary
    const publicId = imageUrl.split("/").pop().split(".")[0]; // crude extraction; can adjust if needed
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error("Cloudinary deletion error:", err);
    }

    // Remove image from topic
    t.images = t.images.filter((img) => img !== imageUrl);
    await t.save();

    // Fetch all subjects with topics for response
    const subjects = await Subject.find({ userId: user._id }).lean();
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (s) => {
        const topics = await Topic.find({ subjectId: s._id }).lean();
        return {
          _id: s._id,
          subject: s.subject,
          public: s.public,
          topics: topics.map(tp => ({
            _id: tp._id,
            topic: tp.topic,
            content: tp.content,
            images: tp.images,
            public: tp.public,
            timestamp: tp.timestamp
          }))
        };
      })
    );

    return NextResponse.json({ subjects: subjectsWithTopics });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete image", details: err.message }, { status: 500 });
  }
};

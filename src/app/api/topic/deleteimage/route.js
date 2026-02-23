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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Find user
    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ✅ Find subject
    const sub = await Subject.findOne({ userId: user._id, subject });
    if (!sub)
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    // ✅ Find topic
    const t = await Topic.findOne({
      userId: user._id,
      subjectId: sub._id,
      topic,
    });

    if (!t)
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    // =====================================================
    // ✅ Extract Cloudinary public_id (FIXED — decode URL)
    // =====================================================
    const extractPublicId = (url) => {
      try {
        const decoded = decodeURIComponent(url.split("?")[0]);

        const parts = decoded.split("/upload/");
        if (parts.length < 2) return null;

        let path = parts[1];

        // remove version
        path = path.replace(/^v\d+\//, "");

        // remove extension
        path = path.replace(/\.[^/.]+$/, "");

        return path;
      } catch {
        return null;
      }
    };

    const publicId = extractPublicId(imageUrl);

    if (!publicId) {
      return NextResponse.json(
        { error: "Invalid image URL" },
        { status: 400 }
      );
    }

    // =====================================================
    // ✅ Delete from Cloudinary
    // =====================================================
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      console.log("Deleting publicId:", publicId, result);

      if (result.result !== "ok" && result.result !== "not found") {
        return NextResponse.json(
          { error: "Failed to delete image from Cloudinary" },
          { status: 500 }
        );
      }
    } catch (err) {
      console.error("Cloudinary deletion error:", err);
      return NextResponse.json(
        { error: "Failed to delete image from Cloudinary", details: err.message },
        { status: 500 }
      );
    }

    // =====================================================
    // ✅ Remove image from DB
    // =====================================================
    t.images = t.images.filter((img) => img !== imageUrl);
    await t.save();

    // =====================================================
    // ✅ Fetch subjects with topics
    // =====================================================
    const subjects = await Subject.find({ userId: user._id }).lean();

    const subjectsWithTopics = await Promise.all(
      subjects.map(async (s) => {
        const topics = await Topic.find({ subjectId: s._id }).lean();

        return {
          _id: s._id,
          subject: s.subject,
          public: s.public,
          topics: topics.map((tp) => ({
            _id: tp._id,
            topic: tp.topic,
            content: tp.content,
            images: tp.images,
            public: tp.public,
            timestamp: tp.timestamp,
          })),
        };
      })
    );

    return NextResponse.json({ subjects: subjectsWithTopics });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to delete image", details: err.message },
      { status: 500 }
    );
  }
};
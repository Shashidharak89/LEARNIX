import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import cloudinary from "@/lib/cloudinary";

export const PUT = async (req) => {
  try {
    await connectDB();
    const { usn, subject, topic, imageUrl } = await req.json();

    if (!usn || !subject || !topic || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const sub = user.subjects.find((s) => s.subject === subject);
    if (!sub) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const t = sub.topics.find((t) => t.topic === topic);
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

    await user.save();

    return NextResponse.json({ subjects: user.subjects });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete image", details: err.message }, { status: 500 });
  }
};

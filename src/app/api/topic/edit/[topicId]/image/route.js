// DELETE /api/topic/edit/[topicId]/image
// Bearer-authenticated. Ownership check. Deletes one image from Cloudinary + DB.
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Topic from "@/models/Topic";
import cloudinary from "@/lib/cloudinary";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

async function getCallerFromBearer(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return await User.findById(decoded.userId).lean();
  } catch { return null; }
}

const extractPublicId = (url) => {
  try {
    const decoded = decodeURIComponent(url.split("?")[0]);
    const parts = decoded.split("/upload/");
    if (parts.length < 2) return null;
    let path = parts[1];
    path = path.replace(/^v\d+\//, "");
    path = path.replace(/\.[^/.]+$/, "");
    return path;
  } catch { return null; }
};

export const DELETE = async (req, { params }) => {
  try {
    await connectDB();
    const caller = await getCallerFromBearer(req);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topicId } = await params;
    const { imageUrl } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });

    const topic = await Topic.findById(topicId);
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    if (String(topic.userId) !== String(caller._id))
      return NextResponse.json({ error: "Forbidden — this topic does not belong to you" }, { status: 403 });

    if (!topic.images.includes(imageUrl))
      return NextResponse.json({ error: "Image not found in this topic" }, { status: 404 });

    // Delete from Cloudinary
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== "ok" && result.result !== "not found") {
          console.warn("Cloudinary delete unexpected result:", result);
        }
      } catch (err) {
        console.error("Cloudinary deletion error:", err);
        return NextResponse.json({ error: "Failed to delete from Cloudinary" }, { status: 500 });
      }
    }

    // Remove from DB
    topic.images = topic.images.filter(img => img !== imageUrl);
    await topic.save();

    return NextResponse.json({ message: "Image deleted", images: topic.images });
  } catch (err) {
    console.error("Delete image error:", err);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
};

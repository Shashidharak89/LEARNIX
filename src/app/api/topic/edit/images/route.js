// DELETE /api/topic/edit/images
// Bearer-authenticated. Ownership check. Deletes multiple images from Cloudinary + DB.
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

export const DELETE = async (req) => {
  try {
    await connectDB();
    const caller = await getCallerFromBearer(req);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { topicId, imageUrls } = body;

    if (!topicId) return NextResponse.json({ error: "topicId is required in body" }, { status: 400 });
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: "imageUrls must be a non-empty array" }, { status: 400 });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    if (String(topic.userId) !== String(caller._id))
      return NextResponse.json({ error: "Forbidden — this topic does not belong to you" }, { status: 403 });

    // Filter only images that actually belong to the topic
    const imagesToDelete = imageUrls.filter(url => topic.images.includes(url));

    if (imagesToDelete.length === 0) {
      return NextResponse.json({ error: "None of the provided images were found in this topic" }, { status: 404 });
    }

    // Delete from Cloudinary
    let deletedCount = 0;
    const failedDeletes = [];

    await Promise.all(
      imagesToDelete.map(async (url) => {
        const publicId = extractPublicId(url);
        if (publicId) {
          try {
            const result = await cloudinary.uploader.destroy(publicId);
            if (result.result === "ok" || result.result === "not found") {
              deletedCount++;
            } else {
               failedDeletes.push(url);
               console.warn("Cloudinary delete unexpected result for", publicId, result);
            }
          } catch (err) {
            failedDeletes.push(url);
            console.error("Cloudinary deletion error for", publicId, err);
          }
        }
      })
    );

    // Remove from DB (we remove it from DB if we attempted to delete it, 
    // you could choose to only remove successfully deleted ones, but standard is to drop from DB anyway)
    const successfullyDeleted = imagesToDelete.filter(img => !failedDeletes.includes(img));
    topic.images = topic.images.filter(img => !successfullyDeleted.includes(img));
    
    await topic.save();

    return NextResponse.json({ 
      message: `${successfullyDeleted.length} images deleted successfully`, 
      deletedImages: successfullyDeleted,
      failedImages: failedDeletes,
      remainingImages: topic.images 
    });
  } catch (err) {
    console.error("Delete multiple images error:", err);
    return NextResponse.json({ error: "Failed to delete images" }, { status: 500 });
  }
};

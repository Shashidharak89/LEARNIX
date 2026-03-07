// PATCH /api/topic/edit/[topicId]/reorder
// Bearer-authenticated. Ownership check. Saves a new image order to DB.
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Topic from "@/models/Topic";
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

export const PATCH = async (req, { params }) => {
  try {
    await connectDB();
    const caller = await getCallerFromBearer(req);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topicId } = await params;
    const { images } = await req.json();

    if (!Array.isArray(images))
      return NextResponse.json({ error: "images must be an array" }, { status: 400 });

    const topic = await Topic.findById(topicId);
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    if (String(topic.userId) !== String(caller._id))
      return NextResponse.json({ error: "Forbidden — this topic does not belong to you" }, { status: 403 });

    // Validate: same set of URLs, just reordered (no additions/removals)
    const existing = new Set(topic.images);
    const incoming = new Set(images);
    if (
      images.length !== topic.images.length ||
      [...incoming].some(url => !existing.has(url))
    ) {
      return NextResponse.json(
        { error: "Invalid reorder: images must be the same set, just reordered" },
        { status: 400 }
      );
    }

    topic.images = images;
    await topic.save();

    return NextResponse.json({ message: "Order saved", images: topic.images });
  } catch (err) {
    console.error("Reorder error:", err);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
};

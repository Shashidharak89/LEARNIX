// GET /api/topic/edit/[topicId]
// Bearer-authenticated. Returns topic only if it belongs to the caller.
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
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

export const GET = async (req, { params }) => {
  try {
    await connectDB();
    const caller = await getCallerFromBearer(req);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topicId } = await params;
    const topic = await Topic.findById(topicId).lean();
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    // Ownership check — topic must belong to the caller
    if (String(topic.userId) !== String(caller._id))
      return NextResponse.json({ error: "Forbidden — this topic does not belong to you" }, { status: 403 });

    const subject = await Subject.findById(topic.subjectId).lean();

    return NextResponse.json({
      topic: {
        _id: topic._id,
        topic: topic.topic,
        images: topic.images || [],
        public: topic.public,
        timestamp: topic.timestamp,
        content: topic.content,
      },
      subject: subject ? { _id: subject._id, subject: subject.subject } : null,
    });
  } catch (err) {
    console.error("Topic edit GET error:", err);
    return NextResponse.json({ error: "Failed to load topic" }, { status: 500 });
  }
};

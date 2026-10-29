import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const dynamic = "force-dynamic";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

function getUserIdFromAuthHeader(req) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded?.userId || decoded?.id || null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const authUser = await resolveAuthenticatedUser(req);
    const userId = authUser?._id ? authUser._id.toString() : getUserIdFromAuthHeader(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(20, parseInt(searchParams.get("limit") || "3", 10)));

    const topics = await Topic.find({ userId })
      .sort({ timestamp: -1, _id: -1 })
      .limit(limit)
      .lean();

    const subjectIds = [...new Set(topics.map((t) => t.subjectId.toString()))];
    const subjects = await Subject.find({ _id: { $in: subjectIds } })
      .select("subject visibility")
      .lean();

    const subjectMap = {};
    subjects.forEach((s) => {
      subjectMap[s._id.toString()] = {
        name: s.subject,
        visibility: s.visibility || "public",
      };
    });

    const formattedTopics = topics.map((t) => {
      const subjInfo = subjectMap[t.subjectId.toString()] || {};
      const validImages = Array.isArray(t.images)
        ? t.images.filter((img) => img && String(img).trim() !== "")
        : [];
      return {
        _id: t._id.toString(),
        topic: t.topic,
        content: t.content || "",
        images: validImages,
        imagesCount: validImages.length,
        visibility: t.visibility || "public",
        timestamp: t.timestamp,
        subjectId: t.subjectId.toString(),
        subjectName: subjInfo.name || "General",
        subjectVisibility: subjInfo.visibility || "public",
      };
    });

    return NextResponse.json({
      success: true,
      topics: formattedTopics,
      count: formattedTopics.length,
    });
  } catch (error) {
    console.error("GET /api/user/resources error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user resources", details: error.message },
      { status: 500 }
    );
  }
}

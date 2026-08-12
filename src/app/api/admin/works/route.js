import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { resolveAuthenticatedUser } from "@/lib/authUser";

// GET /api/admin/works?page=1&pageSize=10
export const GET = async (req) => {
  try {
    await connectDB();

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (auth.tokenProvided && auth.tokenInvalid) {
      return NextResponse.json(
        { error: "Token expired or invalid. Please login again." },
        { status: 401 }
      );
    }

    const caller = auth.user;
    if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) {
      return NextResponse.json(
        { error: "Unauthorized access. Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 10;
    const skip = (page - 1) * pageSize;

    // Fetch all topics (public, private, unlisted) sorted latest first
    const topics = await Topic.find({})
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total = await Topic.countDocuments({});

    const topicsWithDetails = await Promise.all(
      topics.map(async (topic) => {
        const subject = await Subject.findById(topic.subjectId).lean();
        const user = subject ? await User.findById(subject.userId).lean() : null;

        return {
          ...topic,
          images: Array.isArray(topic.images) ? topic.images.slice(0, 2) : [],
          downloadlink: topic.downloadlink || "",
          visibility: topic.visibility || "public",
          subject: subject ? subject.subject : null,
          subjectId: subject ? subject._id : null,
          userName: user ? user.name : null,
          usn: user ? user.usn : null,
          profileimg: user ? user.profileimg : null,
          userId: user ? user._id : null,
        };
      })
    );

    return NextResponse.json({
      topics: topicsWithDetails,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("GET /api/admin/works error:", err);
    return NextResponse.json(
      { error: "Failed to fetch admin works", details: err.message },
      { status: 500 }
    );
  }
};

// PATCH /api/admin/works
// Body: { topicId: string, visibility?: string, downloadlink?: string }
export const PATCH = async (req) => {
  try {
    await connectDB();

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (auth.tokenProvided && auth.tokenInvalid) {
      return NextResponse.json(
        { error: "Token expired or invalid. Please login again." },
        { status: 401 }
      );
    }

    const caller = auth.user;
    if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) {
      return NextResponse.json(
        { error: "Unauthorized access. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { topicId, visibility, downloadlink } = body;

    if (!topicId) {
      return NextResponse.json(
        { error: "Missing required parameter: topicId" },
        { status: 400 }
      );
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: "Work record not found" },
        { status: 404 }
      );
    }

    if (visibility !== undefined) {
      if (!["public", "private", "unlisted"].includes(visibility)) {
        return NextResponse.json(
          { error: "Invalid visibility value. Must be 'public', 'private', or 'unlisted'." },
          { status: 400 }
        );
      }
      topic.visibility = visibility;
    }

    if (downloadlink !== undefined) {
      topic.downloadlink = typeof downloadlink === "string" ? downloadlink.trim() : "";
    }

    await topic.save();

    return NextResponse.json({
      success: true,
      message: "Work record updated successfully",
      topic: {
        _id: topic._id,
        topic: topic.topic,
        visibility: topic.visibility,
        downloadlink: topic.downloadlink,
        timestamp: topic.timestamp,
      },
    });
  } catch (err) {
    console.error("PATCH /api/admin/works error:", err);
    return NextResponse.json(
      { error: "Failed to update work record", details: err.message },
      { status: 500 }
    );
  }
};

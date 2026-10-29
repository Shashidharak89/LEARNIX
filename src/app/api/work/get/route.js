import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const usnParam = searchParams.get("usn");
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 0); // 0 means all
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim();

    // Authenticate via Authorization Bearer token first, then fallback to usnParam
    let user = null;
    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (auth && auth.user) {
      user = auth.user;
    } else if (auth && auth.tokenProvided && auth.tokenInvalid) {
      return NextResponse.json(
        { error: "Token expired or invalid. Please login again." },
        { status: 401 }
      );
    } else if (usnParam) {
      user = await User.findOne({ usn: usnParam.toUpperCase() }).lean();
    }

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please login." },
        { status: 401 }
      );
    }

    // Build subject query for this user
    let query = { userId: user._id };
    if (q) {
      const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedQ, "i");

      // Find any topics belonging to this user that match q (by topic name or content)
      const matchingTopics = await Topic.find({
        userId: user._id,
        $or: [
          { topic: { $regex: regex } },
          { content: { $regex: regex } }
        ]
      }).select("subjectId").lean();

      const matchingSubjectIds = matchingTopics.map((t) => t.subjectId);

      query = {
        userId: user._id,
        $or: [
          { subject: { $regex: regex } },
          { _id: { $in: matchingSubjectIds } }
        ]
      };
    }

    const totalSubjects = await Subject.countDocuments(query);
    let subjects = [];
    if (limit > 0) {
      const skip = (page - 1) * limit;
      subjects = await Subject.find(query).sort({ _id: -1 }).skip(skip).limit(limit).lean();
    } else {
      subjects = await Subject.find(query).sort({ _id: -1 }).lean();
    }

    let subjectsWithTopics = [];
    if (limit > 0) {
      // In paged mode, return subject metadata to keep payload small.
      subjectsWithTopics = subjects.map((subject) => ({
        _id: subject._id,
        subject: subject.subject,
        visibility: subject.visibility || "public"
      }));
    } else {
      // Full behavior: include topics for each subject
      subjectsWithTopics = await Promise.all(
        subjects.map(async (subject) => {
          const topics = await Topic.find({ subjectId: subject._id }).lean();
          topics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          return {
            _id: subject._id,
            subject: subject.subject,
            visibility: subject.visibility || "public",
            topics: topics.map((t) => ({
              _id: t._id,
              topic: t.topic,
              content: t.content,
              images: t.images,
              visibility: t.visibility || "public",
              timestamp: t.timestamp
            }))
          };
        })
      );

      // Sort subjects by their latest topic timestamp
      subjectsWithTopics.sort((a, b) => {
        const latestA = a.topics[0]?.timestamp || 0;
        const latestB = b.topics[0]?.timestamp || 0;
        return new Date(latestB) - new Date(latestA);
      });
    }

    const payload = {
      _id: user._id,
      name: user.name,
      usn: user.usn,
      password: user.password,
      profileimg: user.profileimg,
      subjects: subjectsWithTopics,
      active: user.active ?? 0,
      createdAt: user.createdAt,
      q
    };

    if (limit > 0) {
      payload.paging = { page, limit, total: totalSubjects, returned: subjectsWithTopics.length };
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

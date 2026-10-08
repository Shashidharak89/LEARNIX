import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const authUser = await resolveAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized. Valid authentication token required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const size = Math.max(1, parseInt(searchParams.get("size") || "10", 10));
    const search = (searchParams.get("search") || "").trim();
    const order = (searchParams.get("order") || "asc").toLowerCase() === "desc" ? "desc" : "asc";

    const filter = { userId: authUser._id };

    if (search) {
      const matchingTopicSubjectIds = await Topic.find({
        userId: authUser._id,
        topic: { $regex: search, $options: "i" }
      }).distinct("subjectId");

      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { _id: { $in: matchingTopicSubjectIds } }
      ];
    }

    const sortDirection = order === "desc" ? -1 : 1;
    const totalRecords = await Subject.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / size) || 1;

    const subjects = await Subject.find(filter)
      .collation({ locale: "en", strength: 2 })
      .sort({ subject: sortDirection })
      .skip((page - 1) * size)
      .limit(size)
      .lean();

    const subjectIds = subjects.map((s) => s._id);

    const topicCounts = await Topic.aggregate([
      { $match: { subjectId: { $in: subjectIds } } },
      { $group: { _id: "$subjectId", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    topicCounts.forEach((tc) => {
      countMap[tc._id.toString()] = tc.count;
    });

    const formattedSubjects = subjects.map((s) => ({
      _id: s._id.toString(),
      subject: s.subject,
      visibility: s.visibility || "public",
      createdAt: s.createdAt,
      topicsCount: countMap[s._id.toString()] || 0
    }));

    return NextResponse.json({
      success: true,
      subjects: formattedSubjects,
      pagination: {
        page,
        size,
        totalPages,
        totalRecords,
        search,
        order
      }
    });
  } catch (error) {
    console.error("Error fetching user subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch user subjects", details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { getVisibility } from "@/lib/visibility";
import { resolveAuthenticatedUser } from "@/lib/authUser";

// GET /api/work/getbysubjectid/:id
// Fetches subject with all its topics based on visibility + ownership
export const GET = async (req, { params }) => {
  try {
    await connectDB();

    const { id } = await params; // subject _id

    // Find the subject
    const subject = await Subject.findById(id).lean();
    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Determine if current user is the owner
    const currentUser = await resolveAuthenticatedUser(req);
    const isOwner = currentUser && subject.userId.toString() === currentUser._id.toString();

    const subjectVisibility = getVisibility(subject);

    // In /works, only public content is visible for non-owners
    if ((subjectVisibility === "private" || subjectVisibility === "unlisted") && !isOwner) {
      return NextResponse.json(
        { error: "This subject is not publicly accessible" },
        { status: 403 }
      );
    }

    // Find the user (subject owner)
    const user = await User.findById(subject.userId).lean();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all topics for this subject
    let topicsQuery = { subjectId: id };
    
    // If requester is not owner, expose only public topics
    if (!isOwner) {
      topicsQuery.$or = [{ visibility: "public" }, { visibility: { $exists: false } }];
    }

    const topics = await Topic.find(topicsQuery)
      .select("_id topic content images visibility timestamp userId")
      .sort({ timestamp: -1 })
      .lean();

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        usn: user.usn,
        profileimg: user.profileimg,
      },
      subject: {
        _id: subject._id,
        subject: subject.subject,
        visibility: subjectVisibility,
        timestamp: subject.timestamp,
      },
      topics: topics.map(topic => ({
        _id: topic._id,
        topic: topic.topic,
        content: topic.content,
        images: topic.images,
        visibility: topic.visibility || "public",
        timestamp: topic.timestamp,
      })),
    });
  } catch (err) {
    console.error("Error in getbysubjectid:", err);
    return NextResponse.json(
      { error: "Failed to fetch subject", details: err.message },
      { status: 500 }
    );
  }
};

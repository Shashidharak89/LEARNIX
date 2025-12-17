import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

// GET /api/work/getbysubjectid/:id
// Fetches subject with all its topics (public if subject is public, or all if user is owner)
export const GET = async (req, { params }) => {
  try {
    await connectDB();

    const { id } = await params; // subject _id
    const usn = req.headers.get("x-usn"); // Optional: current user's USN for permission check

    // Find the subject
    const subject = await Subject.findById(id).lean();
    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Determine if current user is the owner
    const currentUser = usn ? await User.findOne({ usn: usn.toUpperCase() }).lean() : null;
    const isOwner = currentUser && subject.userId.toString() === currentUser._id.toString();

    // If subject is private and user is not the owner, deny access
    if (!subject.public && !isOwner) {
      return NextResponse.json(
        { error: "This subject is private and not accessible" },
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
    
    // If subject is public, show only public topics
    // If user is owner, show all topics
    if (!isOwner) {
      topicsQuery.public = true;
    }

    const topics = await Topic.find(topicsQuery)
      .select("_id topic content images public timestamp userId")
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
        public: subject.public,
        timestamp: subject.timestamp,
      },
      topics: topics.map(topic => ({
        _id: topic._id,
        topic: topic.topic,
        content: topic.content,
        images: topic.images,
        public: topic.public,
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

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { getVisibility } from "@/lib/visibility";
import { resolveAuthenticatedUser } from "@/lib/authUser";

// GET /api/work/getbytopicid/:id
export const GET = async (req, { params }) => {
  try {
    await connectDB();

    const { id } = await params; // topic _id

    // Find the topic
    const topic = await Topic.findById(id).lean();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    const caller = await resolveAuthenticatedUser(req);
    const isOwner = caller && topic.userId.toString() === caller._id.toString();

    const topicVisibility = getVisibility(topic);
    if ((topicVisibility === "private" || topicVisibility === "unlisted") && !isOwner) {
      return NextResponse.json(
        { error: "This topic is not publicly accessible" },
        { status: 403 }
      );
    }

    // Find the user
    const user = await User.findById(topic.userId).lean();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find the subject
    const subject = await Subject.findById(topic.subjectId).lean();
    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    const subjectVisibility = getVisibility(subject);
    if ((subjectVisibility === "private" || subjectVisibility === "unlisted") && !isOwner) {
      return NextResponse.json(
        { error: "This subject is not publicly accessible" },
        { status: 403 }
      );
    }

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
      },
      topic: {
        _id: topic._id,
        topic: topic.topic,
        content: topic.content,
        images: topic.images,
        visibility: topicVisibility,
        timestamp: topic.timestamp
      },
    });
  } catch (err) {
    console.error("Error in getbytopicid:", err);
    return NextResponse.json(
      { error: "Failed to fetch topic", details: err.message },
      { status: 500 }
    );
  }
};

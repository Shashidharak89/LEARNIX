import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

// GET /api/work/getbytopicid/:id
export const GET = async (req, { params }) => {
  try {
    await connectDB();

    const { id } = params; // topic _id

    // Find the user that has this topic
    const user = await Work.findOne({ "subjects.topics._id": id });

    if (!user) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Find the subject + topic inside the user
    let foundSubject = null;
    let foundTopic = null;

    for (const subj of user.subjects) {
      const topic = subj.topics.find((t) => t._id.toString() === id);
      if (topic) {
        foundSubject = subj;
        foundTopic = topic;
        break;
      }
    }

    if (!foundTopic) {
      return NextResponse.json(
        { error: "Topic not found in user" },
        { status: 404 }
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
        subject: foundSubject.subject,
      },
      topic: foundTopic,
    });
  } catch (err) {
    console.error("Error in getbytopicid:", err);
    return NextResponse.json(
      { error: "Failed to fetch topic", details: err.message },
      { status: 500 }
    );
  }
};

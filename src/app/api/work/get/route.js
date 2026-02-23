import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const usn = searchParams.get("usn");
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 0); // 0 means all

    if (!usn) {
      return NextResponse.json(
        { error: "USN not found. Please login." },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findOne({ usn: usn.toUpperCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Fetch subjects for this user with optional paging
    const query = { userId: user._id };
    let subjects = [];
    let totalSubjects = await Subject.countDocuments(query);
    if (limit > 0) {
      const skip = (page - 1) * limit;
      subjects = await Subject.find(query).sort({ _id: -1 }).skip(skip).limit(limit).lean();
    } else {
      subjects = await Subject.find(query).lean();
    }
    
    // Fetch topics for each subject and sort
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (subject) => {
        const topics = await Topic.find({ subjectId: subject._id }).lean();
        
        // Sort topics by timestamp (newest first)
        topics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return {
          _id: subject._id,
          subject: subject.subject,
          public: subject.public,
          topics: topics.map(t => ({
            _id: t._id,
            topic: t.topic,
            content: t.content,
            images: t.images,
            public: t.public,
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

    // Return in same format as before, with paging metadata when requested
    const payload = {
      _id: user._id,
      name: user.name,
      usn: user.usn,
      password: user.password,
      profileimg: user.profileimg,
      subjects: subjectsWithTopics,
      // Active deprecated; return dummy value for compatibility
      active: user.active ?? 0,
      createdAt: user.createdAt
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

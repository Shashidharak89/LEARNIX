import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { normalizeVisibility } from "@/lib/visibility";

export const GET = async () => {
  try {
    await connectDB();

    // Get all publicly listed subjects (missing visibility defaults to public)
    const subjects = await Subject.find({
      $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
    }).lean();
    
    // Extract unique subject names with their public topics and latest timestamp
    const subjectMap = {};
    
    for (const subject of subjects) {
      if (!subjectMap[subject.subject]) {
        subjectMap[subject.subject] = {
          name: subject.subject,
          topics: new Set(),
          latestTimestamp: null
        };
      }
      
      // Get publicly listed topics for this subject
      const topics = await Topic.find({
        subjectId: subject._id,
        $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
      }).lean();
      
      topics.forEach(topic => {
        subjectMap[subject.subject].topics.add(topic.topic);
        // Track the latest timestamp for this subject
        if (topic.timestamp) {
          const topicTime = new Date(topic.timestamp);
          if (!subjectMap[subject.subject].latestTimestamp || topicTime > subjectMap[subject.subject].latestTimestamp) {
            subjectMap[subject.subject].latestTimestamp = topicTime;
          }
        }
      });
    }

    // Convert Set to Array and sort by latest timestamp (newest first)
    const subjectsArray = Object.values(subjectMap).map(subject => ({
      name: subject.name,
      topics: Array.from(subject.topics).sort(),
      latestTimestamp: subject.latestTimestamp
    })).sort((a, b) => {
      // Sort by latest timestamp descending (newest first)
      if (!a.latestTimestamp && !b.latestTimestamp) return a.name.localeCompare(b.name);
      if (!a.latestTimestamp) return 1;
      if (!b.latestTimestamp) return -1;
      return new Date(b.latestTimestamp) - new Date(a.latestTimestamp);
    });

    return NextResponse.json({ subjects: subjectsArray, count: subjectsArray.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch subjects", details: err.message }, { status: 500 });
  }
};

export async function PUT(req) {
  try {
    await connectDB();
    const { usn, subjectId, visibility } = await req.json();

    if (!usn || !subjectId) {
      return NextResponse.json({ error: "USN and subjectId are required" }, { status: 400 });
    }

    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subject = await Subject.findOneAndUpdate(
      { _id: subjectId, userId: user._id },
      { $set: { visibility: normalizeVisibility(visibility) } },
      { new: true, runValidators: true }
    );
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Fetch all subjects for response
    const subjects = await Subject.find({ userId: user._id }).lean();

    return NextResponse.json({ message: "Subject visibility updated", subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

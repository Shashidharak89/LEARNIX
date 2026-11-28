import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import { PUT as updateSubjectVisibility } from "../visibility/route";

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

export async function PUT(request) {
  return updateSubjectVisibility(request);
}

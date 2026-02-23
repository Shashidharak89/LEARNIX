import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export const GET = async (request) => {
  try {
    await connectDB();

    // Get query params
    const { searchParams } = new URL(request.url);
    const subjectName = searchParams.get('subject');
    const subjectId = searchParams.get('subjectId');
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 0);

    // If subjectId is provided, return paged topics for that subject (server-side pagination)
    if (subjectId) {
      const query = { subjectId, public: { $ne: false } };
      const total = await Topic.countDocuments(query);
      let topics = [];
      if (limit > 0) {
        const skip = (page - 1) * limit;
        topics = await Topic.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean();
      } else {
        topics = await Topic.find(query).sort({ timestamp: -1 }).lean();
      }

      return NextResponse.json({ subjectId, topics, paging: { page, limit, total, returned: topics.length } });
    }

    // Fallback: old behavior when subject name is provided — return unique topic names across public subjects
    if (!subjectName) {
      return NextResponse.json({ error: "subject or subjectId parameter is required" }, { status: 400 });
    }

    // Find all public subjects with this name
    const subjects = await Subject.find({ 
      subject: subjectName,
      public: { $ne: false }
    }).lean();
    
    // Map to store unique topics with their latest timestamp
    const topicsMap = {};
    
    // Get all public topics from these subjects
    for (const subject of subjects) {
      const topics = await Topic.find({
        subjectId: subject._id,
        public: { $ne: false }
      }).lean();
      
      topics.forEach(topic => {
        const topicName = topic.topic;
        const topicTime = topic.timestamp ? new Date(topic.timestamp) : null;
        
        // Keep the latest timestamp for each unique topic name
        if (!topicsMap[topicName] || (topicTime && (!topicsMap[topicName].timestamp || topicTime > topicsMap[topicName].timestamp))) {
          topicsMap[topicName] = {
            name: topicName,
            timestamp: topicTime
          };
        }
      });
    }

    // Sort topics by timestamp descending (newest first)
    const topics = Object.values(topicsMap)
      .sort((a, b) => {
        if (!a.timestamp && !b.timestamp) return a.name.localeCompare(b.name);
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .map(t => t.name);

    return NextResponse.json({ 
      subject: subjectName,
      topics,
      count: topics.length 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch topics", details: err.message }, 
      { status: 500 }
    );
  }
};

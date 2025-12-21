import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export const GET = async (request) => {
  try {
    await connectDB();

    // Get subject from query parameters
    const { searchParams } = new URL(request.url);
    const subjectName = searchParams.get('subject');

    if (!subjectName) {
      return NextResponse.json(
        { error: "Subject parameter is required" },
        { status: 400 }
      );
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

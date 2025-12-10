import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

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

    const users = await Work.find({});
    
    const topicsSet = new Set();
    
    users.forEach(user => {
      user.subjects?.forEach(subject => {
        // Only include if subject is public and matches the filter
        if (subject.public !== false && subject.subject === subjectName) {
          subject.topics?.forEach(topic => {
            // Only include if topic is public
            if (topic.public !== false) {
              topicsSet.add(topic.topic);
            }
          });
        }
      });
    });

    const topics = Array.from(topicsSet).sort();

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

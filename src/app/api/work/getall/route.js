import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export const GET = async () => {
  try {
    await connectDB();

    // Get all users
    const users = await User.find({}).lean();
    
    // For each user, fetch their subjects and topics
    const usersWithData = await Promise.all(
      users.map(async (user) => {
        // Fetch subjects for this user
        const subjects = await Subject.find({ userId: user._id }).lean();
        
        // Fetch topics for each subject
        const subjectsWithTopics = await Promise.all(
          subjects.map(async (subject) => {
            const topics = await Topic.find({ subjectId: subject._id }).lean();
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
        
        return {
          _id: user._id,
          name: user.name,
          usn: user.usn,
          profileimg: user.profileimg,
          subjects: subjectsWithTopics,
          // Active deprecated; return dummy value for compatibility
          active: user.active ?? 0,
          createdAt: user.createdAt
        };
      })
    );
    
    return NextResponse.json({ users: usersWithData });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch users", details: err.message }, { status: 500 });
  }
};

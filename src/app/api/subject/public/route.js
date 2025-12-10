import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export const GET = async () => {
  try {
    await connectDB();

    // Get all public subjects
    const subjects = await Subject.find({ public: { $ne: false } }).lean();
    
    // Extract unique subject names with their public topics
    const subjectMap = {};
    
    for (const subject of subjects) {
      if (!subjectMap[subject.subject]) {
        subjectMap[subject.subject] = {
          name: subject.subject,
          topics: new Set()
        };
      }
      
      // Get public topics for this subject
      const topics = await Topic.find({
        subjectId: subject._id,
        public: { $ne: false }
      }).lean();
      
      topics.forEach(topic => {
        subjectMap[subject.subject].topics.add(topic.topic);
      });
    }

    // Convert Set to Array and create response format
    const subjectsArray = Object.values(subjectMap).map(subject => ({
      name: subject.name,
      topics: Array.from(subject.topics).sort()
    })).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ subjects: subjectsArray, count: subjectsArray.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch subjects", details: err.message }, { status: 500 });
  }
};

export async function PUT(req) {
  try {
    await connectDB();
    const { usn, subjectId, public: isPublic } = await req.json();

    if (!usn || !subjectId) {
      return NextResponse.json({ error: "USN and subjectId are required" }, { status: 400 });
    }

    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subject = await Subject.findOne({ _id: subjectId, userId: user._id });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Update subject public flag
    subject.public = typeof isPublic === "boolean" ? isPublic : true;
    await subject.save();

    // Fetch all subjects for response
    const subjects = await Subject.find({ userId: user._id }).lean();

    return NextResponse.json({ message: "Subject visibility updated", subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

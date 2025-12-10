import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const GET = async () => {
  try {
    await connectDB();

    const users = await Work.find({});
    
    // Extract unique public subjects with their public topics
    const subjectMap = {};
    
    users.forEach(user => {
      user.subjects?.forEach(subject => {
        // Only include subjects marked as public
        if (subject.public !== false) {
          if (!subjectMap[subject.subject]) {
            subjectMap[subject.subject] = {
              name: subject.subject,
              topics: new Set()
            };
          }
          
          // Add public topics
          subject.topics?.forEach(topic => {
            if (topic.public !== false) {
              subjectMap[subject.subject].topics.add(topic.topic);
            }
          });
        }
      });
    });

    // Convert Set to Array and create response format
    const subjects = Object.values(subjectMap).map(subject => ({
      name: subject.name,
      topics: Array.from(subject.topics).sort()
    })).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ subjects, count: subjects.length });
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

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subject = user.subjects.id(subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Update subject public flag
    subject.public = typeof isPublic === "boolean" ? isPublic : true;

    await user.save();

    return NextResponse.json({ message: "Subject visibility updated", subjects: user.subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

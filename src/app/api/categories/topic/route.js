import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Categories from "@/models/Categories";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, semester, subject, topic } = await req.json();

    if (!usn || !semester || !subject || !topic) {
      return NextResponse.json({ error: "USN, semester, subject, and topic are required" }, { status: 400 });
    }

    const usnUpper = usn.toUpperCase();
    let categories = await Categories.findOne({ usn: usnUpper });

    if (!categories) {
      return NextResponse.json({ error: "Categories not found" }, { status: 404 });
    }

    // Find the semester
    const semesterIndex = categories.semesters.findIndex(s => s.semester === semester);
    if (semesterIndex === -1) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    // Find the subject
    const subjectIndex = categories.semesters[semesterIndex].subjects.findIndex(s => s.subject === subject);
    if (subjectIndex === -1) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if topic already exists in this subject
    const existingTopic = categories.semesters[semesterIndex].subjects[subjectIndex].topics.find(t => t.topic === topic);
    if (existingTopic) {
      return NextResponse.json({ error: "Topic already exists in this subject" }, { status: 400 });
    }

    // Add new topic
    categories.semesters[semesterIndex].subjects[subjectIndex].topics.push({
      topic,
      timestamp: new Date()
    });

    await categories.save();

    return NextResponse.json({
      message: "Topic added successfully",
      categories: {
        name: categories.name,
        usn: categories.usn,
        semesters: categories.semesters
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
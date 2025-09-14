import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Categories from "@/models/Categories";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, semester, subject } = await req.json();

    if (!usn || !semester || !subject) {
      return NextResponse.json({ error: "USN, semester, and subject are required" }, { status: 400 });
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

    // Check if subject already exists in this semester
    const existingSubject = categories.semesters[semesterIndex].subjects.find(s => s.subject === subject);
    if (existingSubject) {
      return NextResponse.json({ error: "Subject already exists in this semester" }, { status: 400 });
    }

    // Add new subject
    categories.semesters[semesterIndex].subjects.push({
      subject,
      topics: [],
      timestamp: new Date()
    });

    await categories.save();

    return NextResponse.json({
      message: "Subject added successfully",
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
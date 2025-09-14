// app/api/semester/subject/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import Category from "@/models/Category";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, semester, subject } = await req.json();

    if (!usn || !semester || !subject) {
      return NextResponse.json({ error: "USN, semester, and subject are required" }, { status: 400 });
    }

    // Update Work model
    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let targetSemester = user.semesters.find(s => s.semester === semester);
    if (!targetSemester) {
      targetSemester = { semester, subjects: [] };
      user.semesters.push(targetSemester);
    }

    // Check if subject already exists in this semester
    const existingSubject = targetSemester.subjects.find(s => s.subject === subject);
    if (!existingSubject) {
      targetSemester.subjects.push({ subject, topics: [] });
      await user.save();
    }

    // Update Category model
    let categories = await Category.findOne();
    if (!categories) {
      categories = new Category({ semesters: [] });
    }

    let categorySemester = categories.semesters.find(s => s.semester === semester);
    if (!categorySemester) {
      categorySemester = { semester, subjects: [] };
      categories.semesters.push(categorySemester);
    }

    const existingCategorySubject = categorySemester.subjects.find(s => s.subject === subject);
    if (!existingCategorySubject) {
      categorySemester.subjects.push({ subject, topics: [] });
      await categories.save();
    }

    return NextResponse.json({ 
      message: "Subject added successfully",
      semesters: user.semesters
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add subject" }, { status: 500 });
  }
}
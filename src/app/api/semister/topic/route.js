// app/api/semester/topic/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import Category from "@/models/Category";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, semester, subject, topic } = await req.json();

    if (!usn || !semester || !subject || !topic) {
      return NextResponse.json({ error: "USN, semester, subject, and topic are required" }, { status: 400 });
    }

    // Update Work model
    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let targetSemester = user.semesters.find(s => s.semester === semester);
    if (!targetSemester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    let targetSubject = targetSemester.subjects.find(s => s.subject === subject);
    if (!targetSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if topic already exists
    const existingTopic = targetSubject.topics.find(t => t.topic === topic);
    if (!existingTopic) {
      targetSubject.topics.push({ topic, content: "", images: [] });
      await user.save();
    }

    // Update Category model
    let categories = await Category.findOne();
    if (!categories) {
      categories = new Category({ semesters: [] });
    }

    let categorySemester = categories.semesters.find(s => s.semester === semester);
    if (!categorySemester) {
      return NextResponse.json({ error: "Category semester not found" }, { status: 404 });
    }

    let categorySubject = categorySemester.subjects.find(s => s.subject === subject);
    if (!categorySubject) {
      return NextResponse.json({ error: "Category subject not found" }, { status: 404 });
    }

    const existingCategoryTopic = categorySubject.topics.find(t => t.topic === topic);
    if (!existingCategoryTopic) {
      categorySubject.topics.push({ topic });
      await categories.save();
    }

    return NextResponse.json({ 
      message: "Topic added successfully",
      semesters: user.semesters
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add topic" }, { status: 500 });
  }
}
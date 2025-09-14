import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

// GET all categories (sem → sub → topics)
export async function GET() {
  try {
    await connectDB();
    let categories = await Category.findOne();
    if (!categories) {
      categories = await Category.create({ semesters: [] });
    }
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST new semester
export async function POST(req) {
  try {
    await connectDB();
    const { type, semester, subject, topic } = await req.json();

    let categories = await Category.findOne();
    if (!categories) categories = await Category.create({ semesters: [] });

    if (type === "semester") {
      categories.semesters.push({ name: semester, subjects: [] });
    } else if (type === "subject") {
      const sem = categories.semesters.find(s => s.name === semester);
      if (!sem) return NextResponse.json({ error: "Semester not found" }, { status: 404 });
      sem.subjects.push({ name: subject, topics: [] });
    } else if (type === "topic") {
      const sem = categories.semesters.find(s => s.name === semester);
      if (!sem) return NextResponse.json({ error: "Semester not found" }, { status: 404 });
      const sub = sem.subjects.find(s => s.name === subject);
      if (!sub) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      sub.topics.push({ name: topic });
    }

    await categories.save();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("POST categories error:", error);
    return NextResponse.json({ error: "Failed to update categories" }, { status: 500 });
  }
}

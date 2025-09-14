// app/api/semester/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import Category from "@/models/Category";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, semester } = await req.json();

    if (!usn || !semester) {
      return NextResponse.json({ error: "USN and semester are required" }, { status: 400 });
    }

    // Update Work model
    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if semester already exists
    const existingSemester = user.semesters.find(s => s.semester === semester);
    if (!existingSemester) {
      user.semesters.push({ semester, subjects: [] });
      await user.save();
    }

    // Update Category model
    let categories = await Category.findOne();
    if (!categories) {
      categories = new Category({ semesters: [] });
    }

    const existingCategorySemester = categories.semesters.find(s => s.semester === semester);
    if (!existingCategorySemester) {
      categories.semesters.push({ semester, subjects: [] });
      await categories.save();
    }

    return NextResponse.json({ 
      message: "Semester added successfully",
      semesters: user.semesters
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add semester" }, { status: 500 });
  }
}
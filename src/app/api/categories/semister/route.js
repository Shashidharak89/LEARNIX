import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Categories from "@/models/Categories";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, semester } = await req.json();

    if (!usn || !semester) {
      return NextResponse.json({ error: "USN and semester are required" }, { status: 400 });
    }

    const usnUpper = usn.toUpperCase();
    let categories = await Categories.findOne({ usn: usnUpper });

    if (!categories) {
      categories = new Categories({
        name: "",
        usn: usnUpper,
        semesters: []
      });
    }

    // Check if semester already exists
    const existingSemester = categories.semesters.find(s => s.semester === semester);
    if (existingSemester) {
      return NextResponse.json({ error: "Semester already exists" }, { status: 400 });
    }

    // Add new semester
    categories.semesters.push({
      semester,
      subjects: [],
      timestamp: new Date()
    });

    await categories.save();

    return NextResponse.json({
      message: "Semester added successfully",
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
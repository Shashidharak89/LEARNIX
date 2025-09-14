import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Categories from "@/models/Categories";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const usn = searchParams.get('usn');

    if (!usn) {
      return NextResponse.json({ error: "USN is required" }, { status: 400 });
    }

    const usnUpper = usn.toUpperCase();
    let categories = await Categories.findOne({ usn: usnUpper });

    if (!categories) {
      // Create empty categories structure if not exists
      categories = new Categories({
        name: "", // Will be updated when user adds first data
        usn: usnUpper,
        semesters: []
      });
      await categories.save();
    }

    return NextResponse.json({
      message: "Categories fetched successfully",
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
// app/api/categories/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();
    let categories = await Category.findOne();
    
    if (!categories) {
      categories = new Category({ semesters: [] });
      await categories.save();
    }
    
    return NextResponse.json({ categories: categories.semesters });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
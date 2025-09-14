import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PredefinedData from "@/models/PredefinedData";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!type || !['semesters', 'subjects', 'topics'].includes(type)) {
      return NextResponse.json({ error: "Valid type is required (semesters, subjects, topics)" }, { status: 400 });
    }

    let data = await PredefinedData.findOne({ type });
    
    if (!data) {
      // Create default data if not exists
      let defaultValues = [];
      switch (type) {
        case 'semesters':
          defaultValues = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];
          break;
        case 'subjects':
          defaultValues = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics', 'Mechanical Engineering', 'Civil Engineering', 'Data Structures', 'Algorithms', 'Database Management'];
          break;
        case 'topics':
          defaultValues = ['Introduction', 'Basics', 'Advanced Concepts', 'Applications', 'Problem Solving', 'Case Studies', 'Review', 'Practice Questions'];
          break;
      }
      
      data = new PredefinedData({
        type,
        values: defaultValues
      });
      await data.save();
    }

    return NextResponse.json({
      message: "Data fetched successfully",
      data: data.values
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { type, value } = await req.json();

    if (!type || !value || !['semesters', 'subjects', 'topics'].includes(type)) {
      return NextResponse.json({ error: "Valid type and value are required" }, { status: 400 });
    }

    let data = await PredefinedData.findOne({ type });
    
    if (!data) {
      data = new PredefinedData({ type, values: [value] });
    } else {
      if (!data.values.includes(value)) {
        data.values.push(value);
        data.updatedAt = new Date();
      }
    }

    await data.save();

    return NextResponse.json({
      message: "Data added successfully",
      data: data.values
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
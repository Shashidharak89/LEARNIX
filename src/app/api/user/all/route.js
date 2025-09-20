// File: src/app/api/user/all/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Work from "@/models/Work";

// ✅ GET: fetch all users (name, usn, profileimg only)
export async function GET() {
  try {
    await dbConnect();

    // Fetch with projection (only name, usn, profileimg)
    const users = await Work.find({}, "name usn profileimg").lean();

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

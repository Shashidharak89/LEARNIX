import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// 📍 POST → Increment active time
export const POST = async (req) => {
  try {
    await connectDB();

    const { usn } = await req.json();

    if (!usn) {
      return NextResponse.json({ error: "USN is required" }, { status: 400 });
    }

    // Active tracking deprecated; return dummy value without modifying DB
    return NextResponse.json({ success: true, active: 0 });
  } catch (err) {
    console.error("Error updating active time:", err);
    return NextResponse.json(
      { error: "Failed to update active time", details: err.message },
      { status: 500 }
    );
  }
};

// 📍 GET → Retrieve current active time
export const GET = async (req) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const usn = url.searchParams.get("usn");

    if (!usn) {
      return NextResponse.json({ error: "USN query parameter is required" }, { status: 400 });
    }

    const normalizedUsn = usn.trim().toUpperCase();
    // Active tracking deprecated; return dummy value without DB read
    return NextResponse.json({ success: true, active: 0 });
  } catch (err) {
    console.error("Error fetching active time:", err);
    return NextResponse.json(
      { error: "Failed to fetch active time", details: err.message },
      { status: 500 }
    );
  }
};

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const GET = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const usnParam = searchParams.get("usn");

    if (!usnParam) {
      return NextResponse.json({ error: "USN is required" }, { status: 400 });
    }

    const usn = usnParam.toUpperCase();
    const user = await Work.findOne({ usn });

    if (!user) {
      // Return a 404 with a clear message
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch user details", details: err.message },
      { status: 500 }
    );
  }
};

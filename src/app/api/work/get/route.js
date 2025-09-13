import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const usn = searchParams.get("usn");

    if (!usn) {
      return NextResponse.json({ error: "USN not found. Please login." }, { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

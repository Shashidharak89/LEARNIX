import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const usn = searchParams.get("usn");

    if (!usn) {
      return NextResponse.json(
        { error: "USN not found. Please login." },
        { status: 400 }
      );
    }

    // Get user
    const user = await Work.findOne({ usn: usn.toUpperCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Sort topics within each subject
    user.subjects.forEach((subject) => {
      subject.topics.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    });

    // Sort subjects by their latest topic timestamp
    user.subjects.sort((a, b) => {
      const latestA = a.topics[0]?.timestamp || 0;
      const latestB = b.topics[0]?.timestamp || 0;
      return new Date(latestB) - new Date(latestA);
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

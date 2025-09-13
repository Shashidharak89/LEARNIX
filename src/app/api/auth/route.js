import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export async function POST(req) {
  try {
    await connectDB();
    const { name, usn } = await req.json();

    if (!usn) {
      return NextResponse.json({ error: "USN is required" }, { status: 400 });
    }

    const usnUpper = usn.toUpperCase(); // Convert USN to uppercase
    let user = await Work.findOne({ usn: usnUpper });

    if (user) {
      // Existing user: ignore name
      return NextResponse.json({
        message: "Logged in successfully",
        user: { name: user.name, usn: user.usn }
      });
    } else {
      // Create new user
      const newUser = new Work({
        name,
        usn: usnUpper,
        subjects: []
      });
      await newUser.save();
      return NextResponse.json({
        message: "Account created",
        user: { name: newUser.name, usn: newUser.usn }
      });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

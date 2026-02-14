import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Update from "@/models/Update";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, subject, public: isPublic } = await req.json(); // ✅ added public

    if (!usn || !subject) {
      return NextResponse.json({ error: "USN and subject are required" }, { status: 400 });
    }

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create new subject for this user
    const newSubject = await Subject.create({
      userId: user._id,
      subject,
      public: isPublic !== undefined ? isPublic : true
    });

    // Create an Update record for this creation
    try {
      await Update.create({
        title: 'Subject creation',
        content: `Created a subject - ${subject}`,
        links: [`/works/subject/${newSubject._id}`],
        userId: user._id
      });
    } catch (uErr) {
      console.error('Failed to create Update record for subject:', uErr);
      // Don't block subject creation on update logging failure
    }

    // Fetch all subjects for response (to maintain compatibility)
    const subjects = await Subject.find({ userId: user._id }).lean();

    return NextResponse.json({ message: "Subject added successfully", subjects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

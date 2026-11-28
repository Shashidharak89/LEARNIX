import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import { normalizeVisibility } from "@/lib/visibility";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export async function POST(req) {
  try {
    await connectDB();
    const { subject: rawSubject, visibility } = await req.json();
    const subject = rawSubject?.trim();

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!auth.user) {
      return NextResponse.json({ error: "Authentication required. Please log in." }, { status: 401 });
    }

    const created = await Subject.create({
      userId: auth.user._id,
      subject,
      visibility: normalizeVisibility(visibility)
    });

    return NextResponse.json({ message: "Subject added successfully", subjectId: created._id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

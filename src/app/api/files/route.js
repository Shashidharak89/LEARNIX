import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db.js";
import File from "../../../models/File.js";

export async function GET() {
  try {
    await connectDB();

    // Get all files, sorted by upload date descending, select only necessary fields
    const files = await File.find({})
      .select('originalName fileid createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

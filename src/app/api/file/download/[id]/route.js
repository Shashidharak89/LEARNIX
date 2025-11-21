import { NextResponse } from "next/server";
import cloudinary from "../../../../../lib/cloudinary.js";
import { connectDB } from "../../../../../lib/db.js";
import File from "../../../../../models/File.js";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    // Find file in database
    const fileDoc = await File.findById(id);
    if (!fileDoc) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Generate a download URL with attachment disposition
    const downloadUrl = cloudinary.url(fileDoc.publicId, {
      resource_type: "auto",
      secure: true,
      attachment: fileDoc.originalName,
      flags: 'attachment'
    });

    // Return the download URL as JSON response
    return NextResponse.json({
      success: true,
      downloadUrl: downloadUrl,
      fileName: fileDoc.originalName
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}

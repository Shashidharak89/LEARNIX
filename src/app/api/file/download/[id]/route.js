import { NextResponse } from "next/server";
import cloudinary from "../../../../../lib/cloudinary.js";
import { connectDB } from "../../../../../lib/db.js";
import File from "../../../../../models/File.js";
import axios from "axios";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = params;

    // Find file in database
    const fileDoc = await File.findById(id);
    if (!fileDoc) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get the Cloudinary URL
    const fileUrl = cloudinary.url(fileDoc.publicId, {
      resource_type: "auto",
      secure: true
    });

    // Fetch the file from Cloudinary
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });

    // Return the file with proper headers for download
    const headers = new Headers();
    headers.set('Content-Type', fileDoc.mimeType || 'application/octet-stream');
    headers.set('Content-Length', response.data.length);
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileDoc.originalName)}"`);

    return new Response(response.data, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import cloudinary from "../../../../../lib/cloudinary.js";
import { connectDB } from "../../../../../lib/db.js";
import File from "../../../../../models/File.js";
import { cleanupExpiredFiles } from "../../../../../lib/fileCleanup.js";

export async function GET(req, { params }) {
  try {
    await connectDB();
    
    // Asynchronously trigger cleanup of files > 24 hours old
    cleanupExpiredFiles().catch(() => {});

    const { id } = await params;
    const cleanId = String(id || "").trim().toLowerCase();

    // Find file in database by fileid
    const fileDoc = await File.findOne({ fileid: cleanId });
    if (!fileDoc) {
      return NextResponse.json({ error: "File not found or expired" }, { status: 404 });
    }

    // Double check 24-hour expiration (86400000 ms)
    const isExpired = Date.now() - new Date(fileDoc.createdAt).getTime() > 24 * 60 * 60 * 1000;
    if (isExpired) {
      if (fileDoc.publicId) {
        try {
          await cloudinary.uploader.destroy(fileDoc.publicId, { resource_type: "raw" });
          await cloudinary.uploader.destroy(fileDoc.publicId, { resource_type: "image" });
          await cloudinary.uploader.destroy(fileDoc.publicId, { resource_type: "video" });
          await cloudinary.uploader.destroy(fileDoc.publicId, { resource_type: "auto" });
        } catch {}
      }
      await File.deleteOne({ _id: fileDoc._id });
      return NextResponse.json({ error: "This file has expired after 24 hours and is no longer available." }, { status: 410 });
    }

    // Direct download URL via Cloudinary fl_attachment transformation
    let downloadUrl = fileDoc.cloudinaryUrl;
    if (typeof downloadUrl === "string" && downloadUrl.includes("res.cloudinary.com")) {
      downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
    }

    // Determine categorization by extension/MIME
    const nameLower = String(fileDoc.originalName || "").toLowerCase();
    const isImage = (fileDoc.mimeType || "").startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(nameLower);
    const isPdf = (fileDoc.mimeType === "application/pdf") || /\.pdf$/i.test(nameLower);
    const isOfficeDoc = /\.(docx?|pptx?|xlsx?|odt|rtf|csv|txt)$/i.test(nameLower);

    // If it's an image, video, audio or PDF, open directly. Otherwise use Google Docs Viewer.
    let viewUrl = fileDoc.cloudinaryUrl;
    if (!isImage && !isPdf && isOfficeDoc) {
      viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileDoc.cloudinaryUrl)}`;
    }

    return NextResponse.json({
      success: true,
      fileid: fileDoc.fileid,
      fileName: fileDoc.originalName,
      mimeType: fileDoc.mimeType,
      size: fileDoc.size,
      isImage,
      isPdf,
      isOfficeDoc,
      cloudinaryUrl: fileDoc.cloudinaryUrl,
      downloadUrl: downloadUrl,
      viewUrl: viewUrl,
      createdAt: fileDoc.createdAt
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}

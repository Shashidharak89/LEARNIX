export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import File from "@/models/File";
import cloudinary from "@/lib/cloudinary";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";

// GET /api/admin/tools/files?page=1&limit=15&search=""
export async function GET(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit"), 10) || 15));
    const search = (searchParams.get("search") || "").trim();

    const filter = {};
    if (search) {
      const escapeRegex = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const regex = new RegExp(escapeRegex, "i");
      filter.$or = [
        { fileid: regex },
        { originalName: regex },
        { mimeType: regex },
        { uploadedBy: regex },
      ];
    }

    const totalRecords = await File.countDocuments(filter);
    const skip = (page - 1) * limit;

    const files = await File.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      files,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        totalRecords,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/tools/files error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch files", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tools/files
// Body: { id, originalName, fileid }
export async function PUT(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const body = await req.json().catch(() => ({}));
    const { id, originalName, fileid } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "File ID is required." }, { status: 400 });
    }

    const fileDoc = await File.findById(id);
    if (!fileDoc) {
      return NextResponse.json({ success: false, error: "File not found." }, { status: 404 });
    }

    const updatePayload = {};

    if (originalName && typeof originalName === "string" && originalName.trim()) {
      updatePayload.originalName = originalName.trim();
    }

    if (fileid && typeof fileid === "string" && fileid.trim()) {
      const cleanFileId = fileid.trim().toLowerCase();
      if (cleanFileId !== fileDoc.fileid) {
        // Check uniqueness
        const duplicate = await File.findOne({ fileid: cleanFileId, _id: { $ne: fileDoc._id } });
        if (duplicate) {
          return NextResponse.json(
            { success: false, error: `File code "${cleanFileId}" is already taken.` },
            { status: 409 }
          );
        }
        updatePayload.fileid = cleanFileId;
      }
    }

    const updatedFile = await File.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "File record updated successfully.",
      file: updatedFile,
    });
  } catch (error) {
    console.error("PUT /api/admin/tools/files error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update file", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tools/files?id=...
export async function DELETE(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "File ID is required." }, { status: 400 });
    }

    const fileDoc = await File.findById(id);
    if (!fileDoc) {
      return NextResponse.json({ success: false, error: "File not found." }, { status: 404 });
    }

    // Clean up Cloudinary storage if publicId is set
    if (fileDoc.publicId) {
      try {
        await cloudinary.uploader.destroy(fileDoc.publicId, { resource_type: "raw" });
        await cloudinary.uploader.destroy(fileDoc.publicId, { resource_type: "image" });
        await cloudinary.uploader.destroy(fileDoc.publicId, { resource_type: "video" });
        await cloudinary.uploader.destroy(fileDoc.publicId, { resource_type: "auto" });
      } catch (cloudErr) {
        console.warn("Cloudinary delete warning:", cloudErr.message);
      }
    }

    await File.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `File "${fileDoc.originalName}" (${fileDoc.fileid}) deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/tools/files error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete file", details: error.message },
      { status: 500 }
    );
  }
}

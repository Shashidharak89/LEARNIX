import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { uploadBufferToCloudinary } from "@/lib/cloudinaryUploadHelper";

export const maxDuration = 60; // Allow 60s for large file uploads on serverless platforms
export const dynamic = "force-dynamic";

export const POST = async (req) => {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");

    if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

    const filename = file.name || `upload-${Date.now()}`;
    const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const folder = userId ? `updates/${userId}` : `updates`;

    const uploadResult = await uploadBufferToCloudinary(buffer, {
      folder,
      filename: file.name || sanitizedName,
    });

    return NextResponse.json({
      file: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        name: file.name || sanitizedName,
        resourceType: uploadResult.resource_type,
      }
    }, { status: 201 });

  } catch (err) {
    console.error('POST /api/updates/upload error:', err);
    return NextResponse.json({ error: 'Upload failed: ' + (err.message || err) }, { status: 500 });
  }
};

export const DELETE = async (req) => {
  try {
    let publicId = "";
    let resourceType = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      publicId = body?.publicId;
      resourceType = body?.resourceType;
    }

    if (!publicId) {
      const { searchParams } = new URL(req.url);
      publicId = searchParams.get("publicId");
      resourceType = searchParams.get("resourceType");
    }

    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    const { destroyCloudinaryFile } = await import("@/lib/cloudinaryDelete");
    const result = await destroyCloudinaryFile(publicId, resourceType);

    return NextResponse.json({
      message: "File deleted from Cloudinary successfully",
      publicId,
      result: result.result || "ok"
    }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/updates/upload error:", err);
    return NextResponse.json({ error: "Failed to delete file from Cloudinary: " + (err.message || err) }, { status: 500 });
  }
};
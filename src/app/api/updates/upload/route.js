import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

export const POST = async (req) => {
  try {
    await connectDB(); // keep pattern consistent, though we may not use DB here

    const formData = await req.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");

    if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

    const filename = file.name || `upload-${Date.now()}`;
    const mime = file.type || "application/octet-stream";
    let resource_type = "raw";
    if (mime.startsWith("image/")) resource_type = "image";
    else if (mime.startsWith("video/")) resource_type = "video";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const folder = userId ? `updates/${userId}` : `updates`;

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({ file: { url: uploadResult.secure_url, name: uploadResult.original_filename || filename, resourceType: resource_type } }, { status: 201 });
  } catch (err) {
    console.error('POST /api/updates/upload error:', err);
    return NextResponse.json({ error: 'Upload failed: ' + (err.message || err) }, { status: 500 });
  }
};

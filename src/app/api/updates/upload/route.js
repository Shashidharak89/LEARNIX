import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

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

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",  // handles images, videos, PDFs, raw files — everything
          public_id: `${Date.now()}_${sanitizedName}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
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
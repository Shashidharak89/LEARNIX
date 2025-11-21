import { NextResponse } from "next/server";
import cloudinary from "../../../../lib/cloudinary.js";
import { connectDB } from "../../../../lib/db.js";
import File from "../../../../models/File.js";

export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary using upload_stream (more reliable)
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "uploaded_files",
          public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}` // Sanitize filename
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Pipe the buffer to the stream
      uploadStream.end(buffer);
    });

    // Save file info to database
    const newFile = new File({
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });

    await newFile.save();

    return NextResponse.json({
      success: true,
      fileId: newFile._id,
      cloudinaryUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

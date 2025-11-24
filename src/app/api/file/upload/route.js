import { NextResponse } from "next/server";
import cloudinary from "../../../../lib/cloudinary.js";
import { connectDB } from "../../../../lib/db.js";
import File from "../../../../models/File.js";

// Function to generate a unique 8-character alphanumeric fileid
const generateFileId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let fileid = '';
  for (let i = 0; i < 8; i++) {
    fileid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return fileid;
};

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

    // Save file info to database with unique fileid
    const newFile = new File({
      originalName: file.name,
      fileid: '', // placeholder
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });

    // Attempt to save with retries in case of duplicate fileid
    for (let attempt = 0; attempt < 5; attempt++) {
      newFile.fileid = generateFileId();
      try {
        await newFile.save();
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 4) {
          // Duplicate key error, retry with new fileid
          continue;
        }
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      fileId: newFile.fileid,
      cloudinaryUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

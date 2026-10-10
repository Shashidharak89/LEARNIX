import { NextResponse } from "next/server";
import cloudinary from "../../../../lib/cloudinary.js";
import { connectDB } from "../../../../lib/db.js";
import File from "../../../../models/File.js";
import { cleanupExpiredFiles } from "../../../../lib/fileCleanup.js";

// Function to generate a unique 4-character alphanumeric fileid in format cncc (c=char, n=number)
const generateFileId = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  let fileid = '';
  fileid += letters.charAt(Math.floor(Math.random() * letters.length));
  fileid += numbers.charAt(Math.floor(Math.random() * numbers.length));
  fileid += letters.charAt(Math.floor(Math.random() * letters.length));
  fileid += letters.charAt(Math.floor(Math.random() * letters.length));
  return fileid;
};

export async function POST(req) {
  try {
    await connectDB();
    cleanupExpiredFiles().catch(() => {});

    const contentType = req.headers.get("content-type") || "";

    // ── Handle JSON payload (Direct Cloudinary upload registration / availability check) ──
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      const {
        cloudinaryUrl,
        publicId,
        originalName,
        size,
        mimeType,
        customCode: customCodeRaw,
        checkOnly
      } = body;

      // Handle availability check request
      if (checkOnly && customCodeRaw) {
        const clean = String(customCodeRaw).toLowerCase().trim();
        if (!/^[a-z0-9_-]{3,20}$/.test(clean)) {
          return NextResponse.json({ available: false, error: "Code must be 3-20 letters/numbers." });
        }
        const existing = await File.findOne({ fileid: clean });
        return NextResponse.json({ available: !existing });
      }

      if (!cloudinaryUrl) {
        return NextResponse.json({ error: "Missing uploaded file URL" }, { status: 400 });
      }

      let finalFileId = '';
      if (customCodeRaw) {
        const clean = String(customCodeRaw).toLowerCase().trim();
        if (!/^[a-z0-9_-]{3,20}$/.test(clean)) {
          return NextResponse.json({ error: "Custom code must be 3-20 letters/numbers." }, { status: 400 });
        }
        const existing = await File.findOne({ fileid: clean });
        if (existing) {
          return NextResponse.json({ error: "Custom code is already in use. Please choose another." }, { status: 409 });
        }
        finalFileId = clean;
      }

      // Save file info to database
      const newFile = new File({
        originalName: originalName || "file",
        fileid: finalFileId || '',
        mimeType: mimeType || "application/octet-stream",
        size: Number(size) || 0,
        cloudinaryUrl,
        publicId: publicId || ""
      });

      if (finalFileId) {
        await newFile.save();
      } else {
        // Retry logic if auto-generating fileid
        for (let attempt = 0; attempt < 5; attempt++) {
          newFile.fileid = generateFileId();
          try {
            await newFile.save();
            break;
          } catch (err) {
            if (err.code === 11000 && attempt < 4) continue;
            throw err;
          }
        }
      }

      return NextResponse.json({
        success: true,
        fileId: newFile.fileid,
        cloudinaryUrl: newFile.cloudinaryUrl
      });
    }

    // ── Handle multipart/form-data payload (Legacy fallback & availability check) ──
    const formData = await req.formData();
    const customCodeRaw = formData.get("customCode");
    const checkOnly = formData.get("checkOnly") === "true";

    // Handle availability check request
    if (checkOnly && customCodeRaw) {
      const clean = String(customCodeRaw).toLowerCase().trim();
      if (!/^[a-z0-9_-]{3,20}$/.test(clean)) {
        return NextResponse.json({ available: false, error: "Code must be 3-20 letters/numbers." });
      }
      const existing = await File.findOne({ fileid: clean });
      return NextResponse.json({ available: !existing });
    }

    // If direct Cloudinary upload was performed and sent via formData
    const directCloudinaryUrl = formData.get("cloudinaryUrl");
    if (directCloudinaryUrl) {
      let finalFileId = '';
      if (customCodeRaw) {
        const clean = String(customCodeRaw).toLowerCase().trim();
        if (!/^[a-z0-9_-]{3,20}$/.test(clean)) {
          return NextResponse.json({ error: "Custom code must be 3-20 letters/numbers." }, { status: 400 });
        }
        const existing = await File.findOne({ fileid: clean });
        if (existing) {
          return NextResponse.json({ error: "Custom code is already in use. Please choose another." }, { status: 409 });
        }
        finalFileId = clean;
      }

      const newFile = new File({
        originalName: formData.get("originalName") || "file",
        fileid: finalFileId || '',
        mimeType: formData.get("mimeType") || "application/octet-stream",
        size: Number(formData.get("size")) || 0,
        cloudinaryUrl: directCloudinaryUrl,
        publicId: formData.get("publicId") || ""
      });

      if (finalFileId) {
        await newFile.save();
      } else {
        for (let attempt = 0; attempt < 5; attempt++) {
          newFile.fileid = generateFileId();
          try {
            await newFile.save();
            break;
          } catch (err) {
            if (err.code === 11000 && attempt < 4) continue;
            throw err;
          }
        }
      }

      return NextResponse.json({
        success: true,
        fileId: newFile.fileid,
        cloudinaryUrl: newFile.cloudinaryUrl
      });
    }

    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    let finalFileId = '';
    if (customCodeRaw) {
      const clean = String(customCodeRaw).toLowerCase().trim();
      if (!/^[a-z0-9_-]{3,20}$/.test(clean)) {
        return NextResponse.json({ error: "Custom code must be 3-20 letters/numbers." }, { status: 400 });
      }
      const existing = await File.findOne({ fileid: clean });
      if (existing) {
        return NextResponse.json({ error: "Custom code is already in use. Please choose another." }, { status: 409 });
      }
      finalFileId = clean;
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "uploaded_files",
          public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
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

      uploadStream.end(buffer);
    });

    // Save file info to database
    const newFile = new File({
      originalName: file.name,
      fileid: finalFileId || '',
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      cloudinaryUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });

    if (finalFileId) {
      await newFile.save();
    } else {
      // Retry logic if auto-generating fileid
      for (let attempt = 0; attempt < 5; attempt++) {
        newFile.fileid = generateFileId();
        try {
          await newFile.save();
          break;
        } catch (err) {
          if (err.code === 11000 && attempt < 4) continue;
          throw err;
        }
      }
    }

    return NextResponse.json({
      success: true,
      fileId: newFile.fileid,
      cloudinaryUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

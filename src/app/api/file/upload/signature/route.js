import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { filename, folder = "uploaded_files" } = body;
    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary credentials missing on server" }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const sanitizedName = (filename || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const publicId = `${Date.now()}_${sanitizedName}`;

    const paramsToSign = {
      folder,
      public_id: publicId,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      success: true,
      credentials: {
        cloudName,
        apiKey,
        timestamp,
        signature,
        folder,
        publicId,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
      }
    }, { status: 200 });
  } catch (err) {
    console.error("POST /api/file/upload/signature error:", err);
    return NextResponse.json({ error: "Failed to generate upload signature: " + (err.message || err) }, { status: 500 });
  }
}

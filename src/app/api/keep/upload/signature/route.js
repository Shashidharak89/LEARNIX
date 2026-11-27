import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import cloudinary from "@/lib/cloudinary";
import { KEEP_FILE_LIMIT } from "@/lib/keepFields";
import { keepFileFolder } from "@/lib/keepFile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const user = await resolveAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Please sign in to access Keep." }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const filename = typeof body.filename === "string" ? body.filename : "saved-file";
    const fileSize = Number(body.fileSize) || 0;
    if (!filename || fileSize <= 0 || fileSize > KEEP_FILE_LIMIT) {
      return NextResponse.json({ error: "Choose a file up to 20 MB." }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "File uploads are not configured." }, { status: 500 });
    }

    const userId = String(user._id || user.id || user.usn || "");
    if (!userId) return NextResponse.json({ error: "Could not identify your account." }, { status: 401 });
    const folder = keepFileFolder(userId);
    const safeName = filename.slice(-180).replace(/[^a-zA-Z0-9._-]/g, "_");
    const publicId = `${randomUUID()}_${safeName}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const uploadType = "authenticated";
    const signature = cloudinary.utils.api_sign_request({ folder, public_id: publicId, timestamp, type: uploadType }, apiSecret);

    return NextResponse.json({ credentials: {
      cloudName, apiKey, timestamp, signature, folder, publicId,
      uploadType, resourceType: "raw",
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("POST /api/keep/upload/signature error:", error.message);
    return NextResponse.json({ error: "Could not prepare the file upload." }, { status: 500 });
  }
}

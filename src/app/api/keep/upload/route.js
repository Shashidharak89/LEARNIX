import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import cloudinary from "@/lib/cloudinary";

import { randomUUID } from "node:crypto";
import { KEEP_FILE_LIMIT } from "@/lib/keepFields";
import { keepFileFolder } from "@/lib/keepFile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectDB();
    const auth = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!auth?.user) return NextResponse.json({ error: "Please sign in to access Keep." }, { status: 401 });
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    if (file.size > KEEP_FILE_LIMIT) return NextResponse.json({ error: "Files must be 20 MB or smaller." }, { status: 413 });
    const userId = String(auth.user._id || auth.user.id || auth.user.usn);
    const safeName = String(file.name || "file").slice(-180).replace(/[^a-zA-Z0-9._-]/g, "_");
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        resource_type: "raw", type: "authenticated", folder: keepFileFolder(userId),
        public_id: `${randomUUID()}_${safeName}`, use_filename: false, overwrite: false,
      }, (error, result) => error ? reject(error) : resolve(result));
      stream.on("error", reject);
      stream.end(buffer);
    });
    return NextResponse.json({ success: true, file: {
      name: file.name || safeName, size: file.size, mimeType: file.type || "application/octet-stream",
      publicId: upload.public_id, format: upload.format || "", resourceType: "raw",
    } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/keep/upload error:", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

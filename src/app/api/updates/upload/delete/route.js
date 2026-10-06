import { NextResponse } from "next/server";
import { destroyCloudinaryFile } from "@/lib/cloudinaryDelete";

export async function POST(req) {
  try {
    let publicId = "";
    let resourceType = "";

    const body = await req.json().catch(() => ({}));
    publicId = body?.publicId;
    resourceType = body?.resourceType;

    if (!publicId) {
      const { searchParams } = new URL(req.url);
      publicId = searchParams.get("publicId");
      resourceType = searchParams.get("resourceType");
    }

    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    const result = await destroyCloudinaryFile(publicId, resourceType);

    return NextResponse.json({
      message: "File deleted from Cloudinary successfully",
      publicId,
      result: result.result || "ok"
    }, { status: 200 });
  } catch (err) {
    console.error("POST /api/updates/upload/delete error:", err);
    return NextResponse.json({ error: "Failed to delete file from Cloudinary: " + (err.message || err) }, { status: 500 });
  }
}

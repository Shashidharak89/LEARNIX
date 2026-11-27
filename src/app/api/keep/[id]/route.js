import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import { deleteKeepItem, getKeepItem, updateKeepItem } from "@/lib/keep";
import { KEEP_TYPES, keepContentError, keepWebUrl } from "@/lib/keepFields";
import { normalizeKeepFile, ownsKeepFile, removeKeepFile } from "@/lib/keepFile";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const errorResponse = (error, status) => NextResponse.json({ error }, { status });
const notFound = () => errorResponse("Keep item not found.", 404);

async function context(req, params) {
  await connectDB();
  const auth = await resolveAuthenticatedUser(req, { withMeta: true });
  if (!auth?.user) return { error: errorResponse("Please sign in to access Keep.", 401) };
  const { id: itemId } = await params;
  if (!/^keep#[a-f0-9-]{36}$/i.test(itemId)) return { error: notFound() };
  return { userId: String(auth.user._id || auth.user.id || auth.user.usn), itemId };
}

export async function PATCH(req, { params }) {
  try {
    const { error, userId, itemId } = await context(req, params);
    if (error) return error;
    const body = await req.json().catch(() => null);
    let changes;
    if (KEEP_TYPES.includes(body?.type)) {
      const url = body.type === "link" ? keepWebUrl(body.url) : null;
      const file = body.type === "file" && body.file ? normalizeKeepFile(userId, body.file) : null;
      if (body.file && !file) return errorResponse("Choose a valid file to upload.", 400);
      // An omitted attachment retains the stored file, checked in the update condition.
      const validation = keepContentError({ ...body, file: file || body.type === "file" });
      if (validation) return errorResponse(validation, 400);
      changes = { type: body.type, title: body.title, content: body.content, url: url?.href || "", file };
    } else if (typeof body?.pinned === "boolean") {
      changes = { pinned: body.pinned };
    } else {
      return errorResponse("No valid changes were provided.", 400);
    }

    const { previous, item } = await updateKeepItem(userId, itemId, changes);
    if (changes.file && previous.file?.publicId !== item.file.publicId) {
      await removeKeepFile(userId, previous.file);
    }
    return NextResponse.json({ success: true, item });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") return notFound();
    console.error("Could not update Keep item:", error.message);
    return errorResponse("Could not update this item.", 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    const { error, userId, itemId } = await context(req, params);
    if (error) return error;
    const item = await deleteKeepItem(userId, itemId);
    await removeKeepFile(userId, item.file);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") return notFound();
    console.error("Could not delete Keep item:", error.message);
    return errorResponse("Could not delete this item.", 500);
  }
}

export async function GET(req, { params }) {
  try {
    const { error, userId, itemId } = await context(req, params);
    if (error) return error;
    const item = await getKeepItem(userId, itemId);
    if (!item) return notFound();
    if (new URL(req.url).searchParams.get("view") === "1") {
      return NextResponse.json({ item }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const file = item.file;
    if (!ownsKeepFile(userId, file)) return errorResponse("File not found.", 404);
    const preview = new URL(req.url).searchParams.get("preview") === "1";
    const safePreviewType = /^(image\/(jpeg|png|gif|webp)|application\/pdf|text\/(plain|markdown|csv))$/i;
    const mimeType = preview && safePreviewType.test(file.mimeType || "") ? file.mimeType : "application/octet-stream";

    // Raw Cloudinary public IDs already include the original extension.
    const signedUrl = cloudinary.utils.private_download_url(file.publicId, "", {
      resource_type: "raw", type: "authenticated", attachment: !preview,
      expires_at: Math.floor(Date.now() / 1000) + 60,
    });
    const upstream = await fetch(signedUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) return errorResponse("Could not retrieve this file.", 502);
    const originalName = typeof file.name === "string" && file.name ? file.name : "saved-file";
    const filename = encodeURIComponent(originalName.toWellFormed())
      .replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`);
    return new Response(upstream.body, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename*=UTF-8''${filename}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not read Keep item:", error.message);
    return errorResponse("Could not open this item.", 500);
  }
}

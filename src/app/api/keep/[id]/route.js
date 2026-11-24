import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import { deleteKeepItem, updateKeepItem } from "@/lib/keep";
import { docClient, KEEP_TABLE } from "@/lib/dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

async function context(req, params) {
  await connectDB();
  const auth = await resolveAuthenticatedUser(req, { withMeta: true });
  if (!auth?.user) return { error: NextResponse.json({ error: "Please sign in to access Keep." }, { status: 401 }) };
  return { userId: String(auth.user._id || auth.user.id || auth.user.usn), itemId: decodeURIComponent((await params).id || "") };
}

export async function PATCH(req, { params }) {
  try {
    const ctx = await context(req, params);
    if (ctx.error) return ctx.error;
    const body = await req.json().catch(() => ({}));
    const previous = body.file?.publicId
      ? await docClient.send(new GetCommand({ TableName: KEEP_TABLE, Key: { userId: ctx.userId, itemId: ctx.itemId } }))
      : null;
    const item = await updateKeepItem(ctx.userId, ctx.itemId, body);
    if (previous?.Item?.file?.publicId && previous.Item.file.publicId !== body.file.publicId) {
      const cloudinary = (await import("@/lib/cloudinary")).default;
      await cloudinary.uploader.destroy(previous.Item.file.publicId, { resource_type: "raw", type: "authenticated" }).catch(() => {});
    }
    return NextResponse.json({ success: true, item });
  } catch (error) {
    const missing = error?.name === "ConditionalCheckFailedException";
    return NextResponse.json({ error: missing ? "Keep item not found." : "Could not update this item." }, { status: missing ? 404 : 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const ctx = await context(req, params);
    if (ctx.error) return ctx.error;
    const existing = await docClient.send(new GetCommand({ TableName: KEEP_TABLE, Key: { userId: ctx.userId, itemId: ctx.itemId } }));
    await deleteKeepItem(ctx.userId, ctx.itemId);
    if (existing.Item?.file?.publicId) {
      const cloudinary = (await import("@/lib/cloudinary")).default;
      await cloudinary.uploader.destroy(existing.Item.file.publicId, { resource_type: "raw", type: "authenticated" }).catch(() => {});
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const missing = error?.name === "ConditionalCheckFailedException";
    return NextResponse.json({ error: missing ? "Keep item not found." : "Could not delete this item." }, { status: missing ? 404 : 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const ctx = await context(req, params);
    if (ctx.error) return ctx.error;
    const result = await docClient.send(new GetCommand({ TableName: KEEP_TABLE, Key: { userId: ctx.userId, itemId: ctx.itemId } }));
    if (!result.Item?.file?.publicId) return NextResponse.json({ error: "File not found." }, { status: 404 });
    const file = result.Item.file;
    const cloudinary = (await import("@/lib/cloudinary")).default;
    const signedUrl = cloudinary.utils.private_download_url(file.publicId, file.format || "", {
      resource_type: "raw", type: "authenticated", attachment: true,
    });
    const upstream = await fetch(signedUrl);
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: "Could not retrieve this file." }, { status: 502 });
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name || "saved-file")}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/keep/[id] download error:", error);
    return NextResponse.json({ error: "Could not download this file." }, { status: 500 });
  }
}

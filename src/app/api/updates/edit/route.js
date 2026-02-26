import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { updateId, userId, title, content, links, files } = body || {};

    if (!updateId || !userId) {
      return NextResponse.json({ error: 'updateId and userId are required' }, { status: 400 });
    }

    if (!title && !content && !links && !files) {
      return NextResponse.json({ error: 'At least one of title, content, links or files must be provided' }, { status: 400 });
    }

    const update = await Update.findById(updateId);
    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    if (!update.userId) {
      return NextResponse.json({ error: 'This update cannot be edited by users' }, { status: 403 });
    }

    if (update.userId.toString() !== String(userId)) {
      return NextResponse.json({ error: 'You are not authorized to edit this update' }, { status: 403 });
    }

    // Find files that were removed (exist in DB but not in the incoming files array)
    if (files !== undefined) {
      const incomingPublicIds = new Set(
        (Array.isArray(files) ? files : []).map(f => f.publicId).filter(Boolean)
      );

      const removedFiles = (update.files || []).filter(
        f => f.publicId && !incomingPublicIds.has(f.publicId)
      );

      if (removedFiles.length > 0) {
        await Promise.all(
          removedFiles.map(f =>
            cloudinary.uploader.destroy(f.publicId, { resource_type: f.resourceType || 'raw' })
              .catch(err => console.error(`Failed to delete ${f.publicId} from Cloudinary:`, err))
          )
        );
      }
    }

    const updatedFields = {};
    if (title !== undefined) updatedFields.title = String(title).trim();
    if (content !== undefined) updatedFields.content = String(content).trim();
    if (links !== undefined) updatedFields.links = Array.isArray(links) ? links : (links ? [links] : []);
    if (files !== undefined) updatedFields.files = Array.isArray(files) ? files : (files ? [files] : []);

    const updated = await Update.findByIdAndUpdate(updateId, { $set: updatedFields }, { new: true }).lean();

    return NextResponse.json({ update: updated }, { status: 200 });
  } catch (error) {
    console.error('POST /api/updates/edit error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
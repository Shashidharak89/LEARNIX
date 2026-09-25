import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { updateId, userId, file } = body || {};
    if (!updateId || !userId || !file) {
      return NextResponse.json({ error: 'updateId, userId and file are required' }, { status: 400 });
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

    // Push the file object to files array
    const updated = await Update.findByIdAndUpdate(updateId, { $push: { files: file } }, { new: true }).lean();

    return NextResponse.json({ update: updated }, { status: 200 });
  } catch (err) {
    console.error('POST /api/updates/files/add error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

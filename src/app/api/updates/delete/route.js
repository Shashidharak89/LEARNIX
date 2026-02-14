import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { updateId, userId } = body || {};

    if (!updateId || !userId) {
      return NextResponse.json({ error: 'updateId and userId are required' }, { status: 400 });
    }

    const update = await Update.findById(updateId);
    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    if (!update.userId) {
      return NextResponse.json({ error: 'This update cannot be deleted by users' }, { status: 403 });
    }

    if (update.userId.toString() !== String(userId)) {
      return NextResponse.json({ error: 'You are not authorized to delete this update' }, { status: 403 });
    }

    await Update.findByIdAndDelete(updateId);

    return NextResponse.json({ message: 'Update deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('POST /api/updates/delete error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { updateId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const update = await Update.findById(updateId);
    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // Only the creator of the update can delete it
    if (!update.userId) {
      return NextResponse.json({ error: 'This update cannot be deleted by users' }, { status: 403 });
    }

    if (update.userId.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'You are not authorized to delete this update' }, { status: 403 });
    }

    await Update.findByIdAndDelete(updateId);

    return NextResponse.json({ message: 'Update deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/updates/[updateId] error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

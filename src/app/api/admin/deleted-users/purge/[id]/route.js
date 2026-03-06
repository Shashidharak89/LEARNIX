// DELETE /api/admin/deleted-users/purge/[id]
// Superadmin only — permanently removes a BackupUser record.
// Subjects/Topics/Files created by the original user are NEVER touched.
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import BackupUser from "@/models/BackupUser";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

async function getCallerFromBearer(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return await User.findById(decoded.userId).lean();
  } catch { return null; }
}

export const DELETE = async (req, { params }) => {
  try {
    await connectDB();
    const caller = await getCallerFromBearer(req);
    if (!caller || caller.role !== "superadmin")
      return NextResponse.json({ error: "Unauthorized — superadmin only" }, { status: 401 });

    const { id } = await params;
    const backup = await BackupUser.findById(id).lean();
    if (!backup) return NextResponse.json({ error: "Backup record not found" }, { status: 404 });

    // Remove only the backup record — uploaded data (subjects/topics/files) is untouched
    await BackupUser.findByIdAndDelete(id);

    return NextResponse.json({
      message: `Backup for ${backup.usn} permanently removed. Uploaded data is preserved.`,
    });
  } catch (err) {
    console.error("Purge backup error:", err);
    return NextResponse.json({ error: "Failed to purge backup" }, { status: 500 });
  }
};

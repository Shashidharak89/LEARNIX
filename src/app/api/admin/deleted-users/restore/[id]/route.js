// POST /api/admin/deleted-users/restore/[id]
// Superadmin only — restore a BackupUser back into the User collection
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

export const POST = async (req, { params }) => {
  try {
    await connectDB();
    const caller = await getCallerFromBearer(req);
    if (!caller || caller.role !== "superadmin")
      return NextResponse.json({ error: "Unauthorized — superadmin only" }, { status: 401 });

    const { id } = await params;
    const backup = await BackupUser.findById(id).lean();
    if (!backup) return NextResponse.json({ error: "Backup record not found" }, { status: 404 });

    // Check if USN already taken in active users
    const existing = await User.findOne({ usn: backup.usn }).lean();
    if (existing)
      return NextResponse.json(
        { error: `USN ${backup.usn} is already in use by an active user. Change their USN first.` },
        { status: 409 }
      );

    // Re-create the user with original data (password already hashed in backup)
    const restored = await User.create({
      _id: backup.originalId,
      name: backup.name,
      usn:  backup.usn,
      password: backup.password,
      role: backup.role,
      profileimg: backup.profileimg,
      token: backup.token,
      tokenCreatedAt: backup.tokenCreatedAt,
      createdAt: backup.originalCreatedAt,
    });

    // Remove from backup collection
    await BackupUser.findByIdAndDelete(id);

    return NextResponse.json({
      message: `User ${backup.usn} restored successfully`,
      user: { name: restored.name, usn: restored.usn, role: restored.role },
    });
  } catch (err) {
    console.error("Restore user error:", err);
    return NextResponse.json({ error: "Failed to restore user" }, { status: 500 });
  }
};

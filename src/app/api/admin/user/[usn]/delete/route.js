// DELETE /api/admin/user/[usn]/delete
// Superadmin only — backs up user to BackupUser, then deletes from User
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import BackupUser from "@/models/BackupUser";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
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

    const { usn } = await params;
    const target = await User.findOne({ usn: usn.toUpperCase() }).lean();
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (target.usn === caller.usn)
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });

    // Backup first
    await BackupUser.create({
      originalId: target._id,
      name: target.name,
      usn: target.usn,
      password: target.password,
      role: target.role,
      profileimg: target.profileimg,
      token: target.token,
      tokenCreatedAt: target.tokenCreatedAt,
      originalCreatedAt: target.createdAt,
      deletedBy: caller.usn,
    });

    // Delete user and their data
    await User.deleteOne({ _id: target._id });
    await Subject.deleteMany({ userId: target._id });
    await Topic.deleteMany({ userId: target._id });

    return NextResponse.json({ message: "User deleted and backed up successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
};

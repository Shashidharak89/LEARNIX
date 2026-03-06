// PATCH /api/admin/user/[usn]/password
// Superadmin only — sets a new hashed password for the target user
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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

export const PATCH = async (req, { params }) => {
  try {
    await connectDB();
    const caller = await getCallerFromBearer(req);
    if (!caller || caller.role !== "superadmin")
      return NextResponse.json({ error: "Unauthorized — superadmin only" }, { status: 401 });

    const { usn } = await params;
    const { newPassword, confirmPassword } = await req.json();

    if (!newPassword || !confirmPassword)
      return NextResponse.json({ error: "Both fields are required" }, { status: 400 });

    if (newPassword !== confirmPassword)
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });

    if (newPassword.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const target = await User.findOne({ usn: usn.toUpperCase() });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const hashed = await bcrypt.hash(newPassword, 12);
    target.password = hashed;
    await target.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
};

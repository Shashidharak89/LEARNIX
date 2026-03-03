// PATCH /api/admin/users/role
// Body: { targetUsn: string, newRole: "admin" | "user" }
// Bearer token required — caller must be superadmin
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

async function getCallerFromBearer(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const caller = await User.findById(decoded.userId).lean();
    return caller;
  } catch {
    return null;
  }
}

export const PATCH = async (req) => {
  try {
    await connectDB();

    const caller = await getCallerFromBearer(req);
    if (!caller || caller.role !== "superadmin") {
      return NextResponse.json({ error: "Only superadmin can change roles" }, { status: 403 });
    }

    const { targetUsn, newRole } = await req.json();

    if (!targetUsn || !["admin", "user"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Prevent superadmin from stripping their own role accidentally
    if (targetUsn.toUpperCase() === caller.usn.toUpperCase() && newRole !== "superadmin") {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    // Use $set so the field is created even if it didn't exist
    const updated = await User.findOneAndUpdate(
      { usn: targetUsn.toUpperCase() },
      { $set: { role: newRole } },
      { new: true }
    ).select("name usn role").lean();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Role change error:", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
};

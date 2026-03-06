// PATCH /api/admin/user/[usn]/edit
// Admin or superadmin — can update name, usn, profileimg of any user
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    if (!caller || (caller.role !== "admin" && caller.role !== "superadmin"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { usn } = await params;
    const target = await User.findOne({ usn: usn.toUpperCase() });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const formData = await req.formData();
    const newName = formData.get("name")?.trim();
    const newUsn  = formData.get("usn")?.trim().toUpperCase();
    const imgFile = formData.get("profileimg"); // File or null

    const updates = {};
    if (newName && newName !== target.name) updates.name = newName;
    if (newUsn  && newUsn  !== target.usn)  {
      const exists = await User.findOne({ usn: newUsn });
      if (exists && String(exists._id) !== String(target._id))
        return NextResponse.json({ error: "USN already taken" }, { status: 409 });
      updates.usn = newUsn;
    }

    // Upload new profile image if provided
    if (imgFile && imgFile.size > 0) {
      const arrayBuffer = await imgFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "learnix/profiles", transformation: [{ width: 300, height: 300, crop: "fill" }] },
          (err, result) => { if (err) reject(err); else resolve(result); }
        ).end(buffer);
      });
      updates.profileimg = uploadResult.secure_url;
    }

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });

    const updated = await User.findByIdAndUpdate(target._id, updates, { new: true })
      .select("-password -token").lean();

    return NextResponse.json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error("Edit user error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
};

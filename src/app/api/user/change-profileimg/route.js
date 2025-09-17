import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import cloudinary from "@/lib/cloudinary";

export const PUT = async (req) => {
  try {
    await connectDB();

    const formData = await req.formData();
    const usn = formData.get("usn");
    const file = formData.get("file"); // file uploaded from frontend

    if (!usn) {
      return NextResponse.json({ error: "USN is required" }, { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let uploadedUrl = user.profileimg; // keep old/default if no file

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadRes = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "learnix-profiles" }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          })
          .end(buffer);
      });

      uploadedUrl = uploadRes.secure_url;
    }

    user.profileimg = uploadedUrl;
    await user.save();

    return NextResponse.json({
      message: "Profile image updated successfully",
      user: { usn: user.usn, profileimg: user.profileimg },
    });
  } catch (err) {
    console.error("Profile image update failed:", err);
    return NextResponse.json(
      { error: "Failed to update profile image", details: err.message },
      { status: 500 }
    );
  }
};

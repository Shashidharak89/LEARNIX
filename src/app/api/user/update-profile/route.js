import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const PUT = async (req) => {
  try {
    await connectDB();
    
    const userResult = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!userResult.user) {
      return NextResponse.json({ error: "Unauthorized: Invalid or missing token" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let newName, newUsn, newProfileUrl, file;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      newName = formData.get("newName");
      newUsn = formData.get("newUsn");
      newProfileUrl = formData.get("newProfileUrl");
      file = formData.get("image"); // Using 'image' as the key for the file
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      newName = body.newName;
      newUsn = body.newUsn;
      newProfileUrl = body.newProfileUrl;
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }

    const user = await User.findById(userResult.user._id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (file && newProfileUrl) {
       return NextResponse.json({ error: "Cannot provide both 'image' file and 'newProfileUrl'. Please provide only one." }, { status: 400 });
    }

    let updatedFields = [];

    // Update name
    if (newName && newName.trim() !== "") {
      user.name = newName.trim();
      updatedFields.push("name");
    }

    // Update USN
    if (newUsn && newUsn.trim() !== "") {
      const newUsnUpper = newUsn.trim().toUpperCase();
      // Check if new USN is already taken by someone else
      const existingUser = await User.findOne({ usn: newUsnUpper });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
         return NextResponse.json({ error: "The new USN is already in use by another account" }, { status: 409 });
      }
      user.usn = newUsnUpper;
      updatedFields.push("usn");
    }

    // Update Profile Image via Cloudinary Upload
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadRes = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "learnix-profiles", resource_type: "image" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      user.profileimg = uploadRes.secure_url;
      updatedFields.push("profileimg (upload)");
    } 
    // Update Profile Image via URL
    else if (newProfileUrl && newProfileUrl.trim() !== "") {
      user.profileimg = newProfileUrl.trim();
      updatedFields.push("profileimg (url)");
    }

    if (updatedFields.length === 0) {
      return NextResponse.json({ message: "No fields were updated", user: { usn: user.usn, name: user.name, profileimg: user.profileimg } }, { status: 200 });
    }

    await user.save();

    return NextResponse.json({
      message: "Profile updated successfully",
      updatedFields,
      user: {
        usn: user.usn,
        name: user.name,
        profileimg: user.profileimg,
      }
    });
  } catch (err) {
    console.error("Profile update failed:", err);
    return NextResponse.json(
      { error: "Failed to update profile", details: err.message },
      { status: 500 }
    );
  }
};

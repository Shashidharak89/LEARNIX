// src/controllers/workController.js
import { NextResponse } from "next/server";
import streamifier from "streamifier";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import cloudinary from "@/lib/cloudinary";

/**
 * Login/create user record by (name, usn)
 */
export async function loginOrGetUser(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, usn: rawUsn } = body;
    if (!rawUsn || !name) {
      return NextResponse.json({ error: "name and usn required" }, { status: 400 });
    }

    const usn = String(rawUsn).toUpperCase();
    let work = await Work.findOne({ usn });
    if (!work) {
      work = await Work.create({ usn, name, contents: [] });
    }

    return NextResponse.json(work, { status: 200 });
  } catch (err) {
    console.error("loginOrGetUser error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * Get user record by USN
 */
export async function getWorkByUsn(req) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const rawUsn = url.searchParams.get("usn");
    if (!rawUsn) return NextResponse.json({ error: "usn required" }, { status: 400 });

    const usn = String(rawUsn).toUpperCase();
    const work = await Work.findOne({ usn });
    return NextResponse.json(work || null, { status: 200 });
  } catch (err) {
    console.error("getWorkByUsn error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * Add a subject
 */
export async function addSubject(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const formData = await req.formData();
    const subject = formData.get("subject");
    if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

    const work = await Work.findById(id);
    if (!work) return NextResponse.json({ error: "work not found" }, { status: 404 });

    work.contents.push({ subject, items: [] });
    await work.save();

    const newSubject = work.contents[work.contents.length - 1];
    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    console.error("addSubject error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Add content under a subject
 */
export async function addContent(req, { params }) {
  try {
    await connectDB();
    const { id, subjectId } = params;
    const body = await req.json();
    const text = body.text ?? "";

    const work = await Work.findById(id);
    if (!work) return NextResponse.json({ error: "work not found" }, { status: 404 });

    const subj = work.contents.id(subjectId);
    if (!subj) return NextResponse.json({ error: "subject not found" }, { status: 404 });

    subj.items.push({ text, files: [] });
    await work.save();

    const newContent = subj.items[subj.items.length - 1];
    return NextResponse.json(newContent, { status: 201 });
  } catch (err) {
    console.error("addContent error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * Upload an image to a specific content and return updated content
 */
export async function uploadFileToContent(req, { params }) {
  try {
    await connectDB();
    const { id, subjectId, contentId } = params;

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) return NextResponse.json({ error: "File required" }, { status: 400 });

    const isImage = /^image\/(jpeg|png|gif|webp|jpg)$/.test(file.type);
    if (!isImage) return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "work_files", resource_type: "image" },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    if (!result?.secure_url) return NextResponse.json({ error: "Upload failed" }, { status: 500 });

    // Save file in MongoDB under the correct content
    const work = await Work.findById(id);
    if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });

    const subject = work.contents.id(subjectId);
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const contentItem = subject.items.id(contentId);
    if (!contentItem) return NextResponse.json({ error: "Content not found" }, { status: 404 });

    contentItem.files.push({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    });

    await work.save();

    // Return the updated content item with all files (for preview)
    const updatedContent = subject.items.id(contentId);

    return NextResponse.json({
      message: "File uploaded successfully",
      content: updatedContent,
    }, { status: 201 });

  } catch (err) {
    console.error("uploadFileToContent error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

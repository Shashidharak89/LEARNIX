import { NextResponse } from "next/server";
import streamifier from "streamifier";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import cloudinary from "@/lib/cloudinary";

/* Create a new Work record (user) */
export async function createWork(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, usn } = body;

    if (!name || !usn) return NextResponse.json({ error: "name and usn required" }, { status: 400 });

    const newWork = await Work.create({ name, usn, contents: [] });
    return NextResponse.json(newWork, { status: 201 });
  } catch (err) {
    console.error("createWork error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* Get all works (for admin/testing) */
export async function getAllWorks() {
  try {
    await connectDB();
    const works = await Work.find().sort({ createdAt: -1 });
    return NextResponse.json(works, { status: 200 });
  } catch (err) {
    console.error("getAllWorks error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* Get a single work by id */
export async function getWorkById(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const work = await Work.findById(id);
    if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });
    return NextResponse.json(work, { status: 200 });
  } catch (err) {
    console.error("getWorkById error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* Add a new subject to a given work */
export async function addSubject(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await req.json();
    const { subject } = body;
    if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

    const work = await Work.findById(id);
    if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });

    work.contents.push({ subject, items: [] });
    await work.save();

    // return the newly added subject (last)
    const newSubject = work.contents[work.contents.length - 1];
    return NextResponse.json(newSubject, { status: 201 });
  } catch (err) {
    console.error("addSubject error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* Add a new content item under a subject (text only initially) */
export async function addContent(req, { params }) {
  try {
    await connectDB();
    const { id, subjectId } = params;
    const body = await req.json();
    const { text } = body;

    const work = await Work.findById(id);
    if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });

    const subject = work.contents.id(subjectId);
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    subject.items.push({ text: text || "", files: [] });
    await work.save();

    const newContent = subject.items[subject.items.length - 1];
    return NextResponse.json(newContent, { status: 201 });
  } catch (err) {
    console.error("addContent error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* Upload a single file and attach to a specific content item (preserves order) */
export async function addFileToContent(req, { params }) {
  try {
    await connectDB();
    const { id, subjectId, contentId } = params;

    // parse multipart form
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // determine upload options (set raw for pdf)
    const originalName = file.name || "";
    const isPDF = /\.pdf$/i.test(originalName) || /application\/pdf/i.test(file.type);
    const uploadOptions = isPDF ? { resource_type: "raw" } : { resource_type: "auto" };

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    const url = result.secure_url;

    // save url into DB at the right location
    const work = await Work.findById(id);
    if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });

    const subject = work.contents.id(subjectId);
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const contentItem = subject.items.id(contentId);
    if (!contentItem) return NextResponse.json({ error: "Content not found" }, { status: 404 });

    contentItem.files.push(url); // append preserves order
    await work.save();

    return NextResponse.json({ url, resource_type: result.resource_type, public_id: result.public_id }, { status: 201 });
  } catch (err) {
    console.error("addFileToContent error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// app/api/upload/route.js
import dbConnect from "@/lib/dbConnect";
import Work from "@/models/Work";
import cloudinary from "@/lib/cloudinary";
import { Readable } from "stream";

export const config = { api: { bodyParser: false } };

async function streamUpload(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "learnix" }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    Readable.from(fileBuffer).pipe(stream);
  });
}

export async function POST(req) {
  await dbConnect();
  try {
    const formData = await req.formData();
    const usn = formData.get("usn");
    const subjectId = formData.get("subjectId");
    const contentId = formData.get("contentId");
    const file = formData.get("file");

    if (!usn || !subjectId || !contentId || !file)
      return new Response(JSON.stringify({ message: "All fields required" }), { status: 400 });

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });

    const subject = user.subjects.id(subjectId);
    if (!subject) return new Response(JSON.stringify({ message: "Subject not found" }), { status: 404 });

    const content = subject.items.id(contentId);
    if (!content) return new Response(JSON.stringify({ message: "Content not found" }), { status: 404 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await streamUpload(buffer);

    content.files.push({ url: result.secure_url, public_id: result.public_id });
    await user.save();

    return new Response(JSON.stringify({ message: "File uploaded", file: result.secure_url }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

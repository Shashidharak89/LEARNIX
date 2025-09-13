import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import cloudinary from "@/lib/cloudinary";

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params; // work record _id
    const formData = await req.formData();
    const usn = formData.get("usn"); // validate owner

    // find record
    const work = await Work.findById(id);
    if (!work) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    if (work.usn !== usn) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Upload file(s)
    const uploadedFiles = [];
    const files = formData.getAll("files");

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileUrl = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "auto" }, (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          })
          .end(buffer);
      });
      uploadedFiles.push(fileUrl);
    }

    // push to DB
    work.files.push(...uploadedFiles);
    await work.save();

    return Response.json(work, { status: 200 });
  } catch (err) {
    console.error("Error in addFile:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

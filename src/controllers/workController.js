import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import cloudinary from "@/lib/cloudinary";

/**
 * Create new Work record with file uploads to Cloudinary
 */
export async function createWork(req) {
  try {
    await connectDB();
    const formData = await req.formData();

    const name = formData.get("name");
    const usn = formData.get("usn");
    const content = formData.get("content");
    const subject = formData.get("subject");

    // Upload files to Cloudinary in order
    const files = formData.getAll("files");
    const uploadedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const fileUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(buffer);
      });

      uploadedFiles.push(fileUrl);
    }

    // Save record in MongoDB
    const newWork = await Work.create({
      name,
      usn,
      content,
      subject,
      files: uploadedFiles, // ordered array
    });

    return Response.json(newWork, { status: 201 });
  } catch (err) {
    console.error("Error in createWork:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Retrieve all Work records
 */
export async function getAllWorks() {
  try {
    await connectDB();
    const works = await Work.find().sort({ createdAt: -1 });
    return Response.json(works, { status: 200 });
  } catch (err) {
    console.error("Error in getAllWorks:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

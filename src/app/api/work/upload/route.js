import dbConnect from "@/lib/dbConnect";
import Work from "@/models/Work";
import cloudinary from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

export const config = {
  api: { bodyParser: false }
};

export async function POST(req) {
  await dbConnect();
  try {
    const formData = await req.formData();
    const usn = formData.get("usn");
    const subjectId = formData.get("subjectId");
    const contentId = formData.get("contentId");
    const file = formData.get("file");

    if (!usn || !subjectId || !contentId || !file) {
      return new Response(JSON.stringify({ message: "Missing parameters" }), { status: 400 });
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });

    const subject = user.subjects.id(subjectId);
    if (!subject) return new Response(JSON.stringify({ message: "Subject not found" }), { status: 404 });

    const content = subject.contents.id(contentId);
    if (!content) return new Response(JSON.stringify({ message: "Content not found" }), { status: 404 });

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload_stream(
      { folder: `learnix/${usn}` },
      async (error, result) => {
        if (error) return new Response(JSON.stringify({ message: error.message }), { status: 500 });
        content.files.push({ url: result.secure_url });
        await user.save();
      }
    );
    Readable.from(buffer).pipe(result);

    return new Response(JSON.stringify({ message: "File uploaded successfully" }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

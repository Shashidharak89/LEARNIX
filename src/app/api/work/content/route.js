import dbConnect from "@/lib/dbConnect";
import Work from "@/models/Work";

export async function POST(req) {
  await dbConnect();
  try {
    const { usn, subjectId, text } = await req.json();
    if (!usn || !subjectId) return new Response(JSON.stringify({ message: "USN and Subject ID required" }), { status: 400 });

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });

    const subject = user.subjects.id(subjectId);
    if (!subject) return new Response(JSON.stringify({ message: "Subject not found" }), { status: 404 });

    subject.contents.push({ text, files: [] });
    await user.save();

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

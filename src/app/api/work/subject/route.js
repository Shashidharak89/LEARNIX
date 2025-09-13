import dbConnect from "@/lib/dbConnect";
import Work from "@/models/Work";

export async function POST(req) {
  await dbConnect();
  try {
    const { usn, title } = await req.json();
    if (!usn || !title) return new Response(JSON.stringify({ message: "USN and Subject title required" }), { status: 400 });

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });

    user.subjects.push({ title, contents: [] });
    await user.save();

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

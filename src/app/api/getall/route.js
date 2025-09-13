// app/api/work/getall/route.js
import dbConnect from "@/lib/dbConnect";
import Work from "@/models/Work";

export async function GET(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const usn = searchParams.get("usn");
    if (!usn) return new Response(JSON.stringify({ message: "USN required" }), { status: 400 });

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

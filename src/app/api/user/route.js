// app/api/user/route.js
import dbConnect from "@/lib/dbConnect";
import Work from "@/models/Work";

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, usn } = body;

    if (!name || !usn)
      return new Response(JSON.stringify({ message: "Name and USN required" }), { status: 400 });

    const usnUpper = usn.toUpperCase();
    let user = await Work.findOne({ usn: usnUpper });

    if (!user) {
      // First login, create user
      user = await Work.create({ name, usn: usnUpper });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();
    const { usn, password } = await req.json();

    if (!usn || !password) {
      return NextResponse.json({ error: "USN and password are required" }, { status: 400 });
    }

    const usnUpper = usn.toUpperCase();
    const user = await User.findOne({ usn: usnUpper });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Account not found or password not set. Please signup first." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({ message: "Logged in successfully", user: { name: user.name, usn: user.usn, profileimg: user.profileimg } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

const generateToken = (userId, usn) =>
  jwt.sign({ userId, usn }, SECRET_KEY, { expiresIn: "30d" });

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    const token = generateToken(user._id.toString(), user.usn);
    return NextResponse.json(
      {
        exists: true,
        user: {
          name: user.name,
          usn: user.usn,
          profileimg: user.profileimg,
          role: user.role,
          email: user.email,
        },
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/auth/by-email error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

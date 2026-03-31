import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

const generateToken = (userId, usn) =>
  jwt.sign({ userId, usn }, SECRET_KEY, { expiresIn: "30d" });

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser?.primaryEmailAddress?.emailAddress || "";
    if (!email) {
      return NextResponse.json({ error: "Email not available" }, { status: 400 });
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
    console.error("GET /api/auth/by-email error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

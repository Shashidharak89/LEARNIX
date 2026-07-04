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

    let user;
    if (usn.includes("@")) {
      user = await User.findOne({ email: usn.trim().toLowerCase() });
    } else {
      user = await User.findOne({ usn: usn.trim().toUpperCase() });
    }

    if (!user || !user.password) {
      return NextResponse.json({ error: "Account not found or password not set. Please signup first." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Backfill role for accounts created before role field was added
    if (!user.role) {
      user.role = "user";
    }
    if (!user.plan) {
      user.plan = "basic";
    }
    await user.save();

    return NextResponse.json({ message: "Logged in successfully", user: { _id: user._id, name: user.name, usn: user.usn, email: user.email, profileimg: user.profileimg, role: user.role, plan: user.plan, balance: user.balance || 0, createdAt: user.createdAt } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

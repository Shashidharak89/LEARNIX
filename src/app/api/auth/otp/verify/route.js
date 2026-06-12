import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Verification from "@/models/Verification";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

const generateToken = (userId, usn) =>
  jwt.sign({ userId, usn }, SECRET_KEY, { expiresIn: "30d" });

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, otp } = body;
    
    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();

    await connectDB();

    // Find matching verification record
    const verificationRecord = await Verification.findOne({ email: emailTrimmed }).sort({ createdAt: -1 });

    if (!verificationRecord) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    // OTP is valid only for 30 minutes from createdAt
    const now = new Date();
    const diffInMs = now.getTime() - verificationRecord.createdAt.getTime();
    if (diffInMs > 30 * 60 * 1000) {
      return NextResponse.json({ error: "OTP expired. Please resend OTP." }, { status: 400 });
    }

    // Check if OTP matches
    const isMatch = await bcrypt.compare(otp, verificationRecord.otp);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    // Fetch user
    let user = await User.findOne({ email: emailTrimmed });
    if (!user) {
      return NextResponse.json({ error: "No account found with this email. Please sign up first." }, { status: 404 });
    }

    // Delete the used verification record
    await Verification.deleteMany({ email: emailTrimmed });

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.usn);

    // Save token to user
    user.token = token;
    user.tokenCreatedAt = new Date();
    // Backfill role for old accounts that have none
    if (!user.role) user.role = "user";
    if (!user.plan) user.plan = "basic";
    await user.save();

    return NextResponse.json({
      message: "Logged in successfully",
      user: { name: user.name, usn: user.usn, profileimg: user.profileimg, role: user.role, plan: user.plan },
      token
    }, { status: 200 });

  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

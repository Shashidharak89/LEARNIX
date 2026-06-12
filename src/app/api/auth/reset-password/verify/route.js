import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ResetVerification from "@/models/ResetVerification";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, otp, newPassword, confirmPassword } = body;
    
    if (!email || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();

    await connectDB();

    // Find matching verification record
    const verificationRecord = await ResetVerification.findOne({ email: emailTrimmed }).sort({ createdAt: -1 });

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
      return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
    }

    // Delete the used verification record
    await ResetVerification.deleteMany({ email: emailTrimmed });

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      message: "Password reset successfully. You can now login.",
    }, { status: 200 });

  } catch (error) {
    console.error("Reset Password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

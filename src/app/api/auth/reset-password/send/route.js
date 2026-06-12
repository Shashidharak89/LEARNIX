import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ResetVerification from "@/models/ResetVerification";
import User from "@/models/User";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body?.email;
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();

    await connectDB();

    // Check if user exists
    const user = await User.findOne({ email: emailTrimmed });
    if (!user) {
      return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
    }
    const userId = user._id;

    // Limit OTP resend requests: Delete old OTPs for the same email
    await ResetVerification.deleteMany({ email: emailTrimmed });

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save to DB
    await ResetVerification.create({
      email: emailTrimmed,
      userId,
      otp: hashedOtp,
      createdAt: new Date()
    });

    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_KEY,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_ID,
      to: emailTrimmed,
      subject: "Password Reset OTP for Learnix",
      text: `Your OTP to reset your password is: ${otp}. It is valid for 30 minutes.`
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Send Reset OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

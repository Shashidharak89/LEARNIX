import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Verification from "@/models/Verification";
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

    // Limit OTP resend requests: Delete old OTPs for the same email
    await Verification.deleteMany({ email: emailTrimmed });

    // Find if user exists to attach userId (optional, but good for tracking)
    const user = await User.findOne({ email: emailTrimmed });
    const userId = user ? user._id : null;

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save to DB
    await Verification.create({
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
      subject: "Your Learnix OTP Code for Login",
      text: `Your OTP for login is: ${otp}. It is valid for 30 minutes.`
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";
const GOOGLE_CLIENT_ID = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const generateToken = (userId, usn) =>
  jwt.sign({ userId, usn }, SECRET_KEY, { expiresIn: "30d" });

export async function POST(req) {
  try {
    if (!GOOGLE_CLIENT_ID || !googleClient) {
      return NextResponse.json({ error: "Google auth is not configured on server." }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const credential = String(body?.credential || "").trim();
    if (!credential) {
      return NextResponse.json({ error: "Google credential is required." }, { status: 400 });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = String(payload?.email || "").trim().toLowerCase();
    const emailVerified = Boolean(payload?.email_verified);

    if (!email || !emailVerified) {
      return NextResponse.json({ error: "Google account email is missing or not verified." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "This Google account is not linked with any Learnix account yet." },
        { status: 404 }
      );
    }

    if (!user.role) {
      user.role = "user";
    }
    if (!user.plan) {
      user.plan = "basic";
    }

    const token = generateToken(user._id.toString(), user.usn);
    user.token = token;
    user.tokenCreatedAt = new Date();
    await user.save();

    return NextResponse.json({
      message: "Logged in with Google successfully.",
      user: {
        name: user.name,
        usn: user.usn,
        profileimg: user.profileimg,
        role: user.role,
        plan: user.plan,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("POST /api/auth/google-login error:", error);
    return NextResponse.json({ error: "Google login failed." }, { status: 500 });
  }
}

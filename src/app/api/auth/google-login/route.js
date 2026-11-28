import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";
const GOOGLE_CLIENT_ID = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const generateToken = (userId) =>
  jwt.sign({ userId }, SECRET_KEY, { expiresIn: "30d" });

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

    let user = await User.findOne({ email });
    let created = false;

    if (!user) {
      for (let attempt = 0; attempt < 5 && !user; attempt += 1) {
        const usn = `GGL${randomBytes(6).toString("hex").toUpperCase()}`;
        const generatedPassword = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
        const candidate = new User({
          name: String(payload?.name || "Learnix User").trim() || "Learnix User",
          usn,
          email,
          password: generatedPassword,
          profileimg: String(payload?.picture || "").trim() || undefined,
          role: "user",
          plan: "basic",
          lastLoginAt: new Date(),
        });

        try {
          await candidate.save();
          user = candidate;
          created = true;
        } catch (error) {
          if (error?.code !== 11000) throw error;
          // Concurrent first sign-ins can race on email or generated USN.
          user = await User.findOne({ email });
          if (!user && attempt === 4) throw error;
        }
      }
    }

    if (!user) throw new Error("Could not create a Learnix account for this Google user.");

    if (!user.role) {
      user.role = "user";
    }
    if (!user.plan) {
      user.plan = "basic";
    }

    const token = generateToken(user._id.toString());
    user.token = token;
    user.tokenCreatedAt = new Date();
    user.lastLoginAt = new Date();
    await user.save();

    return NextResponse.json({
      message: created
        ? `Your Learnix account is ready. Your Learnix ID is ${user.usn}.`
        : "Logged in with Google successfully.",
      user: {
        name: user.name,
        usn: user.usn,
        profileimg: user.profileimg,
        role: user.role,
        plan: user.plan,
        balance: user.balance || 0,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("POST /api/auth/google-login error:", error);
    return NextResponse.json({ error: "Google login failed." }, { status: 500 });
  }
}

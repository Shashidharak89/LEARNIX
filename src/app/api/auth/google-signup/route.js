import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";
const GOOGLE_CLIENT_ID = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const DEFAULT_PROFILE_IMG =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

const generateToken = (userId, usn) =>
  jwt.sign({ userId, usn }, SECRET_KEY, { expiresIn: "30d" });

function generateRandomPassword() {
  return crypto.randomBytes(16).toString("hex");
}

async function verifyGoogleCredential(credential) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const email = String(payload?.email || "").trim().toLowerCase();
  const emailVerified = Boolean(payload?.email_verified);
  const name = String(payload?.name || "").trim();
  const picture = String(payload?.picture || "").trim();

  if (!email || !emailVerified) {
    throw new Error("Google account email is missing or not verified.");
  }

  return { email, name: name || "Google User", picture: picture || DEFAULT_PROFILE_IMG };
}

export async function POST(req) {
  try {
    if (!GOOGLE_CLIENT_ID || !googleClient) {
      return NextResponse.json({ error: "Google auth is not configured on server." }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const step = String(body?.step || "verify").trim().toLowerCase();
    const credential = String(body?.credential || "").trim();

    if (!credential) {
      return NextResponse.json({ error: "Google credential is required." }, { status: 400 });
    }

    await connectDB();

    const googleUser = await verifyGoogleCredential(credential);

    if (step === "verify") {
      const existingByEmail = await User.findOne({ email: googleUser.email }).lean();
      if (existingByEmail) {
        return NextResponse.json(
          { error: "This Google account is already linked. Please login with Google." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          message: "Google account verified. Enter your USN to continue.",
          profile: {
            name: googleUser.name,
            email: googleUser.email,
            profileimg: googleUser.picture,
          },
        },
        { status: 200 }
      );
    }

    if (step !== "create") {
      return NextResponse.json({ error: "Invalid signup step." }, { status: 400 });
    }

    const usn = String(body?.usn || "").trim().toUpperCase();
    if (!usn) {
      return NextResponse.json({ error: "USN / Register Number is required." }, { status: 400 });
    }

    const existingByEmail = await User.findOne({ email: googleUser.email }).lean();
    if (existingByEmail) {
      return NextResponse.json(
        { error: "This Google account is already linked. Please login with Google." },
        { status: 409 }
      );
    }

    const existingByUsn = await User.findOne({ usn }).lean();
    if (existingByUsn) {
      return NextResponse.json(
        { error: "USN already exists. Please use another USN or login." },
        { status: 409 }
      );
    }

    const randomPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUser = new User({
      name: googleUser.name,
      usn,
      email: googleUser.email,
      password: hashedPassword,
      profileimg: googleUser.picture || DEFAULT_PROFILE_IMG,
      role: "user",
    });

    const token = generateToken(newUser._id.toString(), newUser.usn);
    newUser.token = token;
    newUser.tokenCreatedAt = new Date();
    await newUser.save();

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          name: newUser.name,
          usn: newUser.usn,
          email: newUser.email,
          profileimg: newUser.profileimg,
          role: newUser.role,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error?.message || "Google signup failed.";
    const isKnownGoogleError = /google|credential|verified/i.test(errorMessage);
    return NextResponse.json(
      { error: isKnownGoogleError ? errorMessage : "Google signup failed." },
      { status: isKnownGoogleError ? 400 : 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { resolveAuthenticatedUser } from "@/lib/authUser";

const GOOGLE_CLIENT_ID = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export async function POST(req) {
  try {
    if (!GOOGLE_CLIENT_ID || !googleClient) {
      return NextResponse.json({ error: "Google auth is not configured on server." }, { status: 500 });
    }

    await connectDB();

    const authResult = await resolveAuthenticatedUser(req, { withMeta: true });
    if (!authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const currentUser = await User.findById(authResult.user._id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const existingEmailOwner = await User.findOne({ email });
    if (existingEmailOwner && existingEmailOwner._id.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: "This Google email is already linked to another account." }, { status: 409 });
    }

    currentUser.email = email;
    await currentUser.save();

    return NextResponse.json({
      message: "Google account linked successfully.",
      user: {
        name: currentUser.name,
        usn: currentUser.usn,
        email: currentUser.email,
        plan: currentUser.plan || "basic",
      },
    });
  } catch (error) {
    console.error("POST /api/auth/google error:", error);
    return NextResponse.json({ error: "Failed to link Google account." }, { status: 500 });
  }
}

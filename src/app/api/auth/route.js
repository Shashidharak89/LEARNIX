// api/auth/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import bcrypt from "bcryptjs";

const DEFAULT_PROFILE_IMG =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export async function POST(req) {
  // Legacy combined endpoint is deprecated. Use /api/auth/login for logging in and /api/auth/signup for registering.
  return NextResponse.json({ error: "Use /api/auth/login or /api/auth/signup for authentication" }, { status: 400 });
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export async function GET(req) {
  try {
    await connectDB();

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });

    if (auth.tokenProvided && auth.tokenInvalid) {
      return NextResponse.json(
        { error: "Token expired or invalid. Please login again." },
        { status: 401 }
      );
    }

    if (!auth.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(auth.user._id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        usn: user.usn,
        name: user.name,
        role: user.role || "user",
        plan: user.plan || "basic",
      },
    });
  } catch (error) {
    console.error("GET /api/auth/verify-token error:", error);
    return NextResponse.json({ error: "Failed to verify token" }, { status: 500 });
  }
}

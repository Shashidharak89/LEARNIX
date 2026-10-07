import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";

// GET /api/admin/resources/verify-user?usn=...
export async function GET(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const usn = (searchParams.get("usn") || "").trim().toUpperCase();

    if (!usn) {
      return NextResponse.json({ error: "USN is required" }, { status: 400 });
    }

    const user = await User.findOne({ usn }).select("_id name usn email profileimg role").lean();

    if (!user) {
      return NextResponse.json(
        { exists: false, message: `No user found with USN "${usn}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      exists: true,
      user,
    });
  } catch (err) {
    console.error("GET /api/admin/resources/verify-user error:", err);
    return NextResponse.json(
      { error: "Failed to verify user", details: err.message },
      { status: 500 }
    );
  }
}

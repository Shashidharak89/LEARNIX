import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/searches/user-info?userId=...&usn=...
 * Admin endpoint to fetch minimal user info for the search records modal.
 */
export async function GET(req) {
  try {
    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = (searchParams.get("userId") || "").trim();
    const usn = (searchParams.get("usn") || "").trim().toUpperCase();

    let user = null;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId)
        .select("_id name usn email profileimg role plan")
        .lean();
    }

    if (!user && usn) {
      user = await User.findOne({ usn })
        .select("_id name usn email profileimg role plan")
        .lean();
    }

    if (!user && userId) {
      // Try searching usn with userId string in case USN was passed in userId
      user = await User.findOne({ usn: userId.toUpperCase() })
        .select("_id name usn email profileimg role plan")
        .lean();
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name || "Anonymous",
        usn: user.usn || "N/A",
        email: user.email || "No email",
        profileimg: user.profileimg || "",
        role: user.role || "user",
        plan: user.plan || "basic",
      },
    });
  } catch (err) {
    console.error("GET /api/admin/searches/user-info error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch user info" },
      { status: 500 }
    );
  }
}

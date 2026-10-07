import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";

// GET /api/admin/resources/users?search=""&limit=20
export async function GET(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));

    const filter = {};
    if (search) {
      const escapeRegex = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const regex = new RegExp(escapeRegex, "i");
      filter.$or = [{ name: regex }, { usn: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id name usn email profileimg role")
      .lean();

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/admin/resources/users error:", err);
    return NextResponse.json(
      { error: "Failed to search users", details: err.message },
      { status: 500 }
    );
  }
}

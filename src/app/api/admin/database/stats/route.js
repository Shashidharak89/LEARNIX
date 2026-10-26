import { NextResponse } from "next/server";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import { getDatabaseStats } from "@/lib/databaseExportHelper";

export async function GET(req) {
  try {
    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const stats = await getDatabaseStats();

    return NextResponse.json({
      success: true,
      stats
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/database/stats error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to fetch database statistics"
    }, { status: 500 });
  }
}

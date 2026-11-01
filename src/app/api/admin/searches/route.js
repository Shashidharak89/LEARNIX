import { NextResponse } from "next/server";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import { getSearches } from "@/lib/searchTracker";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/searches?page=1&size=20&search=""
 * Admin/superadmin endpoint to list search history from DynamoDB with pagination & filtering.
 */
export async function GET(req) {
  try {
    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const size = Math.max(1, Math.min(100, parseInt(searchParams.get("size") || "20", 10)));
    const search = (searchParams.get("search") || "").trim();

    const result = await getSearches({ page, size, search });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("GET /api/admin/searches error:", err);
    return NextResponse.json(
      { error: "Failed to fetch searches", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

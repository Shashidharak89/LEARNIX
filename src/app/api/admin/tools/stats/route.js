export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import File from "@/models/File";
import TextShare from "@/models/TextShare";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";

// GET /api/admin/tools/stats
export async function GET(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const [totalFiles, totalTexts, filesAgg] = await Promise.all([
      File.countDocuments({}),
      TextShare.countDocuments({}),
      File.aggregate([
        { $group: { _id: null, totalBytes: { $sum: "$size" } } },
      ]),
    ]);

    const totalBytes = filesAgg[0]?.totalBytes || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalFiles,
        totalTexts,
        totalBytes,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/tools/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tools stats", details: error.message },
      { status: 500 }
    );
  }
}

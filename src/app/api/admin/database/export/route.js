import { NextResponse } from "next/server";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import { generateCollectionCSV } from "@/lib/databaseExportHelper";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection") || "resources";

    const allowed = ["resources", "study-materials", "updates", "users"];
    if (!allowed.includes(collection)) {
      return NextResponse.json(
        { error: `Invalid collection: ${collection}. Must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await generateCollectionCSV(collection);

    // If client requested JSON metadata or direct download
    const format = searchParams.get("format");
    if (format === "json") {
      return NextResponse.json({
        success: true,
        collection,
        filename: result.filename,
        rowCount: result.rowCount,
        sizeBytes: result.sizeBytes,
        csvData: result.csvContent
      }, { status: 200 });
    }

    // Return direct CSV file response with download headers
    return new Response(result.csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Length": String(result.sizeBytes),
        "X-Row-Count": String(result.rowCount),
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  } catch (err) {
    console.error("GET /api/admin/database/export error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to generate CSV export"
    }, { status: 500 });
  }
}

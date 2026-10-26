import { NextResponse } from "next/server";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import { DATABASE_SCHEMAS, getCopyableSchemaJSON, getCopyableHeadersCSV } from "@/lib/databaseSchemas";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection");

    if (collection) {
      const schema = DATABASE_SCHEMAS[collection];
      if (!schema) {
        return NextResponse.json(
          { error: `Unknown collection schema: ${collection}` },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        schema,
        headersCSV: getCopyableHeadersCSV(collection),
        jsonSchema: getCopyableSchemaJSON(collection)
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      schemas: DATABASE_SCHEMAS
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/database/schema error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to fetch schema metadata"
    }, { status: 500 });
  }
}

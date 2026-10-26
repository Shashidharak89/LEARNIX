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

    // Parse header and up to 10 sample data rows
    const lines = result.csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const headerLine = lines[0] || "";
    const headers = parseCSVLine(headerLine);

    const sampleRows = [];
    const limit = Math.min(10, lines.length - 1);
    for (let i = 1; i <= limit; i++) {
      sampleRows.push(parseCSVLine(lines[i]));
    }

    return NextResponse.json({
      success: true,
      collection,
      filename: result.filename,
      rowCount: result.rowCount,
      headers,
      sampleRows
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/database/preview error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to generate preview"
    }, { status: 500 });
  }
}

function parseCSVLine(text) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  values.push(current);
  return values;
}

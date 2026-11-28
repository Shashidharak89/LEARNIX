import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import { docClient, PAGE_VISITS_TABLE } from "@/lib/dynamodb";
import { getLearnixDateId, isValidDateId } from "@/lib/pageVisits";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const requestedDate = new URL(req.url).searchParams.get("date") || getLearnixDateId();
    if (!isValidDateId(requestedDate)) {
      return NextResponse.json({ error: "Date must use YYYY-MM-DD format." }, { status: 400 });
    }

    const result = await docClient.send(new GetCommand({
      TableName: PAGE_VISITS_TABLE,
      Key: { id: requestedDate },
      ConsistentRead: true,
    }));
    const visits = Array.isArray(result.Item?.visits) ? result.Item.visits : [];

    return NextResponse.json({
      success: true,
      date: requestedDate,
      timestamp: result.Item?.timestamp || null,
      updatedAt: result.Item?.updatedAt || null,
      totalVisits: visits.reduce((total, visit) => total + Math.max(0, Number(visit.count) || 0), 0),
      pageCount: visits.length,
      visits: visits.slice().sort((a, b) => Number(b.count || 0) - Number(a.count || 0)),
    });
  } catch (error) {
    console.error("GET /api/admin/page-visits error:", error);
    return NextResponse.json({ error: "Failed to fetch page visits." }, { status: 500 });
  }
}

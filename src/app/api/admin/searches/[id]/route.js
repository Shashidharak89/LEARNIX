import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";
import { docClient, SEARCHES_TABLE } from "@/lib/dynamodb";

export async function DELETE(req, { params }) {
  try {
    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { id } = await params;
    const searchId = String(id || "").trim();
    if (!/^srch_[0-9]+_[a-z0-9]+$/i.test(searchId)) {
      return NextResponse.json({ error: "A valid search record ID is required." }, { status: 400 });
    }

    await docClient.send(new DeleteCommand({
      TableName: SEARCHES_TABLE,
      Key: { id: searchId },
      ConditionExpression: "attribute_exists(id)",
    }));

    return NextResponse.json({ success: true, deletedId: searchId });
  } catch (error) {
    if (error?.name === "ConditionalCheckFailedException") {
      return NextResponse.json({ error: "This search record no longer exists." }, { status: 404 });
    }

    console.error("DELETE /api/admin/searches/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete search record." }, { status: 500 });
  }
}

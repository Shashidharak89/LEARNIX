import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import { removeFromLearnLater } from "@/lib/learnLater";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/learn-later/[id]
 * Remove an item from Learn Later in DynamoDB
 */
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const auth = await resolveAuthenticatedUser(req, { withMeta: true });

    if (!auth?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please login with your Learnix account.",
        },
        { status: 401 }
      );
    }

    const userId = String(auth.user._id || auth.user.id || auth.user.usn);
    const resolvedParams = await Promise.resolve(params);
    const itemId = decodeURIComponent(resolvedParams.id || "");

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "Missing itemId" },
        { status: 400 }
      );
    }

    await removeFromLearnLater(userId, { itemId });

    return NextResponse.json({
      success: true,
      removedId: itemId,
      message: "Item removed from Learn Later",
    });
  } catch (err) {
    console.error("DELETE /api/learn-later/[id] error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to remove item", details: err.message },
      { status: 500 }
    );
  }
}

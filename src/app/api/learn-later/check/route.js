import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import { checkItemsSaved } from "@/lib/learnLater";

export const dynamic = "force-dynamic";

/**
 * POST /api/learn-later/check
 * Check if given items are saved in Learn Later for the authenticated user
 */
export async function POST(req) {
  try {
    await connectDB();
    const auth = await resolveAuthenticatedUser(req, { withMeta: true });

    if (!auth?.user) {
      return NextResponse.json({ success: true, savedMap: {} });
    }

    const userId = String(auth.user._id || auth.user.id || auth.user.usn);
    const body = await req.json().catch(() => ({}));
    const items = body.items || [];

    const savedMap = await checkItemsSaved(userId, items);

    return NextResponse.json({
      success: true,
      savedMap,
    });
  } catch (err) {
    console.error("POST /api/learn-later/check error:", err);
    return NextResponse.json({ success: false, savedMap: {} });
  }
}

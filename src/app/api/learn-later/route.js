import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import {
  getLearnLaterItems,
  addToLearnLater,
  toggleLearnLater,
} from "@/lib/learnLater";

export const dynamic = "force-dynamic";

/**
 * GET /api/learn-later?type=...&q=...&sort=...
 * Fetch user's Learn Later items from DynamoDB
 */
export async function GET(req) {
  try {
    await connectDB();
    const auth = await resolveAuthenticatedUser(req, { withMeta: true });

    if (!auth?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please login with your Learnix account.",
          items: [],
          total: 0,
          counts: { all: 0, resource: 0, update: 0, "study-material": 0, "question-paper": 0 },
        },
        { status: 401 }
      );
    }

    const userId = String(auth.user._id || auth.user.id || auth.user.usn);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const search = searchParams.get("q") || searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";

    const data = await getLearnLaterItems(userId, { type, search, sort });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err) {
    console.error("GET /api/learn-later error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Learn Later items", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learn-later
 * Save or toggle an item in Learn Later in DynamoDB
 */
export async function POST(req) {
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
    const body = await req.json().catch(() => ({}));

    if (!body.type || (!body.targetId && !body.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: type and targetId are required.",
        },
        { status: 400 }
      );
    }

    const action = body.action || "toggle";
    let result;

    if (action === "add") {
      const item = await addToLearnLater(userId, body);
      result = { isSaved: true, item, itemId: item.itemId };
    } else {
      result = await toggleLearnLater(userId, body);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("POST /api/learn-later error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update Learn Later", details: err.message },
      { status: 500 }
    );
  }
}

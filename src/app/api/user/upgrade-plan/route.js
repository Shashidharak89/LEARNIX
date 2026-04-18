import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { resolveAuthenticatedUser } from "@/lib/authUser";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Please login to continue." }, { status: 401 });
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });

    if (auth.tokenProvided && auth.tokenInvalid) {
      return NextResponse.json(
        { error: "Token expired or invalid. Please login again." },
        { status: 401 }
      );
    }

    if (!auth.user) return unauthorizedResponse();

    const currentPlan = String(auth.user?.plan || "basic").toLowerCase();

    return NextResponse.json({
      user: {
        _id: auth.user._id,
        usn: auth.user.usn,
        plan: currentPlan,
      },
      canUpgradeToPro: currentPlan !== "pro",
    });
  } catch (error) {
    console.error("GET /api/user/upgrade-plan error:", error);
    return NextResponse.json({ error: "Failed to fetch plan status." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const requestedPlan = String(body?.plan || "").toLowerCase();
    if (requestedPlan !== "pro") {
      return NextResponse.json(
        { error: "Invalid plan request. Send plan: 'pro'." },
        { status: 400 }
      );
    }

    const auth = await resolveAuthenticatedUser(req, { withMeta: true });

    if (auth.tokenProvided && auth.tokenInvalid) {
      return NextResponse.json(
        { error: "Token expired or invalid. Please login again." },
        { status: 401 }
      );
    }

    if (!auth.user) return unauthorizedResponse();

    const user = await User.findById(auth.user._id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const currentPlan = String(user.plan || "basic").toLowerCase();
    if (currentPlan === "pro") {
      return NextResponse.json({
        message: "Your account is already on Pro.",
        user: {
          _id: user._id,
          usn: user.usn,
          plan: "pro",
        },
      });
    }

    user.plan = "pro";
    await user.save();

    return NextResponse.json({
      message: "Congratulations! Your Learnix Pro is now active.",
      user: {
        _id: user._id,
        usn: user.usn,
        plan: user.plan,
      },
    });
  } catch (error) {
    console.error("POST /api/user/upgrade-plan error:", error);
    return NextResponse.json({ error: "Failed to upgrade plan." }, { status: 500 });
  }
}

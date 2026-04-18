import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const usnParam = String(searchParams.get("usn") || "").trim().toUpperCase();
    if (!usnParam) {
      return NextResponse.json({ error: "USN is required." }, { status: 400 });
    }

    const userByUsn = await User.findOne({ usn: usnParam });
    if (!userByUsn) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const hasPlan = typeof userByUsn.plan === "string" && userByUsn.plan.trim() !== "";
    const currentPlan = hasPlan ? userByUsn.plan.trim().toLowerCase() : "basic";

    if (!hasPlan) {
      await User.updateOne(
        { _id: userByUsn._id },
        { $set: { plan: "basic" } }
      );
    }

    return NextResponse.json({
      user: {
        _id: userByUsn._id,
        usn: userByUsn.usn,
        plan: currentPlan,
      },
      canUpgradeToPro: currentPlan !== "pro",
    }, { headers: { "Cache-Control": "no-store" } });
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
    const requestedUsn = String(body?.usn || "").trim().toUpperCase();

    if (!requestedUsn) {
      return NextResponse.json({ error: "USN is required." }, { status: 400 });
    }

    if (requestedPlan !== "pro") {
      return NextResponse.json(
        { error: "Invalid plan request. Send plan: 'pro'." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ usn: requestedUsn }).lean();
    if (!existingUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const existingPlan = String(existingUser.plan || "").trim().toLowerCase();
    if (existingPlan === "pro") {
      return NextResponse.json({
        message: "You are already in Pro.",
        user: {
          _id: existingUser._id,
          usn: existingUser.usn,
          plan: "pro",
        },
      });
    }

    const updateResult = await User.updateOne(
      { _id: existingUser._id },
      { $set: { plan: "pro" } }
    );

    if (!updateResult?.acknowledged) {
      return NextResponse.json({ error: "Plan update failed." }, { status: 500 });
    }

    const verifiedUser = await User.findById(existingUser._id).lean();

    if (!verifiedUser || String(verifiedUser.plan || "").toLowerCase() !== "pro") {
      return NextResponse.json(
        { error: "Plan update failed. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Your plan is now Pro.",
      user: {
        _id: verifiedUser._id,
        usn: verifiedUser.usn,
        plan: "pro",
      },
    });
  } catch (error) {
    console.error("POST /api/user/upgrade-plan error:", error);
    return NextResponse.json({ error: "Failed to upgrade plan." }, { status: 500 });
  }
}

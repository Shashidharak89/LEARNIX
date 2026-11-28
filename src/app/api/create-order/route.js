import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function razorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured.");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(req) {
  try {
    const user = await resolveAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: "Please sign in to create a payment." }, { status: 401 });
    if (!["admin", "superadmin"].includes(String(user.role || "").toLowerCase())) {
      return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    if (!Number.isSafeInteger(amount) || amount < 100) {
      return NextResponse.json({ error: "Amount must be at least 100 paise (₹1.00)." }, { status: 400 });
    }

    const receipt = `lx_${randomUUID()}`;
    const order = await razorpayClient().orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: {
        createdBy: String(user._id),
        createdByUsn: String(user.usn || ""),
        description: String(body.description || "Learnix payment").slice(0, 200),
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/create-order error:", error?.error?.description || error.message);
    return NextResponse.json({ error: "Could not create the Razorpay order. Please try again." }, { status: 500 });
  }
}

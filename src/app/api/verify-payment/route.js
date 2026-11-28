import { createHmac, timingSafeEqual } from "node:crypto";
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
    if (!user) return NextResponse.json({ error: "Please sign in to verify this payment." }, { status: 401 });
    if (!["admin", "superadmin"].includes(String(user.role || "").toLowerCase())) {
      return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const paymentId = String(body.razorpay_payment_id || "");
    const orderId = String(body.razorpay_order_id || "");
    const suppliedSignature = String(body.razorpay_signature || "");
    if (!paymentId || !orderId || !suppliedSignature) {
      return NextResponse.json({ error: "Payment ID, order ID, and signature are required." }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || !process.env.RAZORPAY_KEY_ID) {
      throw new Error("Razorpay credentials are not configured.");
    }
    const expectedSignature = createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest();
    const receivedSignature = Buffer.from(suppliedSignature, "hex");
    if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(expectedSignature, receivedSignature)) {
      return NextResponse.json({ error: "Payment signature is invalid." }, { status: 400 });
    }

    const order = await razorpayClient().orders.fetch(orderId);
    if (String(order.notes?.createdBy || "") !== String(user._id)) {
      return NextResponse.json({ error: "This payment order does not belong to your account." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      payment_id: paymentId,
      order_id: orderId,
      amount: order.amount,
      currency: order.currency,
      message: "Payment signature verified.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/verify-payment error:", error?.error?.description || error.message);
    return NextResponse.json({ error: "Could not verify the payment. Please try again." }, { status: 500 });
  }
}

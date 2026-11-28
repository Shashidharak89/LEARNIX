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

function getOrderError(error) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return "Razorpay server credentials are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env, then restart the server.";
  }
  if (Number(error?.statusCode) === 401 || Number(error?.statusCode) === 403) {
    return "Razorpay rejected the API credentials. Confirm the key ID and secret belong to the same test or live account, then restart the server.";
  }

  const description = String(error?.error?.description || "").trim();
  if (description) return `Razorpay could not create the order: ${description}`;

  return "Could not create the Razorpay order. Check the server logs and try again.";
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
    console.error("POST /api/create-order error:", {
      statusCode: error?.statusCode || null,
      code: error?.error?.code || null,
      description: error?.error?.description || error.message,
    });
    return NextResponse.json({ error: getOrderError(error) }, { status: 500 });
  }
}

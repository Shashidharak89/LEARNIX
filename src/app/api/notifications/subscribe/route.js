import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const POST = async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const { usn, subscription } = body;

    // Validate required fields
    if (!usn || !subscription) {
      return NextResponse.json(
        { error: "USN and subscription object are required" },
        { status: 400 }
      );
    }

    // Validate subscription object structure
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    // Find user and update notification subscription
    const user = await Work.findOne({
      usn: { $regex: new RegExp(`^${usn.trim()}$`, "i") }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user with subscription data
    // Note: You'll need to add a 'notificationSubscription' field to your Work model
    user.notificationSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      subscribedAt: new Date()
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Notification subscription saved successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error saving notification subscription:", error);
    return NextResponse.json(
      { 
        error: "Failed to save notification subscription",
        details: error.message 
      },
      { status: 500 }
    );
  }
};

export const DELETE = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const usn = searchParams.get("usn");

    if (!usn) {
      return NextResponse.json(
        { error: "USN is required" },
        { status: 400 }
      );
    }

    // Find user and remove notification subscription
    const user = await Work.findOne({
      usn: { $regex: new RegExp(`^${usn.trim()}$`, "i") }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    user.notificationSubscription = null;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Notification subscription removed successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error removing notification subscription:", error);
    return NextResponse.json(
      { 
        error: "Failed to remove notification subscription",
        details: error.message 
      },
      { status: 500 }
    );
  }
};

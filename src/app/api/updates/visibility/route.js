import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Update from "@/models/Update";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

function getUserIdFromAuthHeader(req) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const authUserId = getUserIdFromAuthHeader(req);
    const body = await req.json().catch(() => ({}));
    const { updateId, visibility, userId } = body || {};

    const effectiveUserId = authUserId || userId;

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token in Authorization header" },
        { status: 401 }
      );
    }

    if (!updateId || !mongoose.Types.ObjectId.isValid(updateId)) {
      return NextResponse.json(
        { error: "Invalid or missing updateId" },
        { status: 400 }
      );
    }

    const validVisibilities = ["public", "private", "unlisted"];
    if (!visibility || !validVisibilities.includes(visibility)) {
      return NextResponse.json(
        { error: `Invalid visibility. Must be one of: ${validVisibilities.join(", ")}` },
        { status: 400 }
      );
    }

    const update = await Update.findById(updateId);
    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    if (!update.userId || update.userId.toString() !== String(effectiveUserId)) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to change the visibility of this update" },
        { status: 403 }
      );
    }

    update.visibility = visibility;
    await update.save();

    return NextResponse.json(
      {
        success: true,
        message: `Visibility updated to ${visibility}`,
        updateId: update._id,
        visibility: update.visibility,
        update,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/updates/visibility error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

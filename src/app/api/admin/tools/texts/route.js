export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TextShare from "@/models/TextShare";
import { verifyAdminOrSuperAdmin } from "@/lib/adminAuth";

// GET /api/admin/tools/texts?page=1&limit=15&search=""
export async function GET(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit"), 10) || 15));
    const search = (searchParams.get("search") || "").trim();

    const filter = {};
    if (search) {
      const escapeRegex = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const regex = new RegExp(escapeRegex, "i");
      filter.$or = [
        { code: regex },
        { text: regex },
      ];
    }

    const totalRecords = await TextShare.countDocuments(filter);
    const skip = (page - 1) * limit;

    const texts = await TextShare.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      texts,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        totalRecords,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/tools/texts error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shared texts", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tools/texts
// Body: { id, text, code, editAccess }
export async function PUT(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const body = await req.json().catch(() => ({}));
    const { id, text, code, editAccess } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Text record ID is required." }, { status: 400 });
    }

    const doc = await TextShare.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: "Text record not found." }, { status: 404 });
    }

    const updatePayload = {};

    if (typeof text === "string" && text.trim().length > 0) {
      updatePayload.text = text;
    }

    if (typeof editAccess === "boolean") {
      updatePayload.editAccess = editAccess;
    }

    if (code && typeof code === "string" && code.trim()) {
      const cleanCode = code.trim().toLowerCase();
      if (cleanCode !== doc.code) {
        // Validate alphanumeric
        if (!/^[a-z0-9]+$/.test(cleanCode)) {
          return NextResponse.json(
            { success: false, error: "Code must contain only lowercase letters and numbers." },
            { status: 400 }
          );
        }
        // Check uniqueness
        const duplicate = await TextShare.findOne({ code: cleanCode, _id: { $ne: doc._id } });
        if (duplicate) {
          return NextResponse.json(
            { success: false, error: `Code "${cleanCode}" is already taken.` },
            { status: 409 }
          );
        }
        updatePayload.code = cleanCode;
      }
    }

    const updatedText = await TextShare.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Text record updated successfully.",
      textShare: updatedText,
    });
  } catch (error) {
    console.error("PUT /api/admin/tools/texts error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update text", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tools/texts?id=...
export async function DELETE(req) {
  try {
    await connectDB();

    const authCheck = await verifyAdminOrSuperAdmin(req);
    if (!authCheck.authorized) return authCheck.response;

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Text record ID is required." }, { status: 400 });
    }

    const doc = await TextShare.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: "Text record not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Shared text (${doc.code}) deleted successfully from database.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/tools/texts error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete text record", details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import QuestionPaperV2 from "@/models/QuestionPaperV2";
import mongoose from "mongoose";

export async function PATCH(req, { params }) {
    try {
        await connectDB();

        const user = await resolveAuthenticatedUser(req);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = params;
        const { action } = await req.json(); // action: "publish" or "unpublish"

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid question paper ID" },
                { status: 400 }
            );
        }

        if (!["publish", "unpublish"].includes(action)) {
            return NextResponse.json(
                { success: false, message: "Invalid action. Use 'publish' or 'unpublish'" },
                { status: 400 }
            );
        }

        const qp = await QuestionPaperV2.findById(id);

        if (!qp) {
            return NextResponse.json(
                { success: false, message: "Question paper not found" },
                { status: 404 }
            );
        }

        // Check if user is admin or the uploader
        if (qp.uploadedBy.toString() !== user._id.toString() && user.role !== "admin" && user.role !== "superadmin") {
            return NextResponse.json(
                { success: false, message: "You can only manage your own question papers" },
                { status: 403 }
            );
        }

        if (action === "publish") {
            qp.isPublished = true;
        } else if (action === "unpublish") {
            qp.isPublished = false;
        }

        qp.updatedAt = new Date();
        await qp.save();

        return NextResponse.json(
            {
                success: true,
                message: `Question paper ${action}ed successfully`,
                data: {
                    id: qp._id,
                    title: qp.title,
                    isPublished: qp.isPublished
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating publish status:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to update publish status",
                error: error.message
            },
            { status: 500 }
        );
    }
}

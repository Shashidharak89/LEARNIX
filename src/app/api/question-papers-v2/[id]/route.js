import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";
import QuestionPaperV2 from "@/models/QuestionPaperV2";
import mongoose from "mongoose";

export async function GET(req, { params }) {
    try {
        await connectDB();

        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid question paper ID" },
                { status: 400 }
            );
        }

        const qp = await QuestionPaperV2.findById(id)
            .populate("university", "name code")
            .populate("college", "name code")
            .populate("subject", "name code")
            .populate("semester", "name semesterNumber")
            .populate("examType", "name code")
            .populate("batch", "name year")
            .populate("uploadedBy", "name email");

        if (!qp) {
            return NextResponse.json(
                { success: false, message: "Question paper not found" },
                { status: 404 }
            );
        }

        // Format references with "NA" for null values
        const doc = qp.toObject();
        const referenceFields = ["university", "college", "subject", "semester", "examType", "batch", "uploadedBy"];
        referenceFields.forEach((field) => {
            if (!doc[field]) {
                doc[field] = "NA";
            }
        });

        return NextResponse.json(
            {
                success: true,
                data: doc
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching question paper:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch question paper",
                error: error.message
            },
            { status: 500 }
        );
    }
}

export async function PUT(req, { params }) {
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid question paper ID" },
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

        // Check if user is the uploader or admin
        if (qp.uploadedBy.toString() !== user._id.toString() && user.role !== "admin" && user.role !== "superadmin") {
            return NextResponse.json(
                { success: false, message: "You can only edit your own question papers" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const {
            title,
            university,
            college,
            subject,
            semester,
            examType,
            batch,
            fileUrl,
            fileName,
            totalQuestions,
            difficulty
        } = body;

        if (title) qp.title = title;
        if (university !== undefined) qp.university = university || null;
        if (college !== undefined) qp.college = college || null;
        if (subject !== undefined) qp.subject = subject || null;
        if (semester !== undefined) qp.semester = semester || null;
        if (examType !== undefined) qp.examType = examType || null;
        if (batch !== undefined) qp.batch = batch || null;
        if (fileUrl) qp.fileUrl = fileUrl;
        if (fileName) qp.fileName = fileName;
        if (totalQuestions !== undefined) qp.totalQuestions = totalQuestions;
        if (difficulty) qp.difficulty = difficulty;

        qp.updatedAt = new Date();
        await qp.save();

        const populated = await qp.populate([
            { path: "universe", select: "name code" },
            { path: "college", select: "name code" },
            { path: "subject", select: "name code" },
            { path: "semester", select: "name semesterNumber" },
            { path: "examType", select: "name code" },
            { path: "batch", select: "name year" },
            { path: "uploadedBy", select: "name email" }
        ]);

        const doc = populated.toObject();
        const referenceFields = ["university", "college", "subject", "semester", "examType", "batch", "uploadedBy"];
        referenceFields.forEach((field) => {
            if (!doc[field]) {
                doc[field] = "NA";
            }
        });

        return NextResponse.json(
            {
                success: true,
                message: "Question paper updated successfully",
                data: doc
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating question paper:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to update question paper",
                error: error.message
            },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid question paper ID" },
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

        // Check if user is the uploader or admin
        if (qp.uploadedBy.toString() !== user._id.toString() && user.role !== "admin" && user.role !== "superadmin") {
            return NextResponse.json(
                { success: false, message: "You can only delete your own question papers" },
                { status: 403 }
            );
        }

        await QuestionPaperV2.deleteOne({ _id: id });

        // NOTE: No cascade delete - other references to this QP will show "NA" if accessed

        return NextResponse.json(
            {
                success: true,
                message: "Question paper deleted successfully"
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting question paper:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to delete question paper",
                error: error.message
            },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuestionPaper from "@/models/QuestionPaper";

export async function GET(req, { params }) {
    try {
        await connectDB();

        const { id } = await params;

        const paper = await QuestionPaper.findById(id).lean();

        if (!paper) {
            return NextResponse.json(
                { error: "Question paper not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            paper: {
                _id: paper._id,
                subject: paper.subject,
                batch: paper.batch,
                examType: paper.examType,
                semester: paper.semester,
                description: paper.description,
                uploadedBy: paper.uploadedBy,
                createdAt: paper.createdAt,
                images: paper.images // Full list of images
            }
        }, { status: 200 });
    } catch (error) {
        console.error("GET /api/question-papers/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch question paper" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await connectDB();

        const { id } = await params;

        const paper = await QuestionPaper.findByIdAndDelete(id);

        if (!paper) {
            return NextResponse.json(
                { error: "Question paper not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Question paper deleted successfully"
        }, { status: 200 });
    } catch (error) {
        console.error("DELETE /api/question-papers/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete question paper" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuestionPaper from "@/models/QuestionPaper";

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const batch = searchParams.get("batch"); // Optional filter
        const examType = searchParams.get("examType"); // Optional filter
        const subject = searchParams.get("subject"); // Optional filter

        const query = {};
        if (batch) query.batch = batch;
        if (examType) query.examType = examType;
        if (subject) query.subject = { $regex: subject, $options: "i" };

        const papers = await QuestionPaper.find(query)
            .select("_id subject batch examType semester description uploadedBy createdAt")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            total: papers.length,
            papers
        }, { status: 200 });
    } catch (error) {
        console.error("GET /api/question-papers error:", error);
        return NextResponse.json({ error: "Failed to fetch question papers" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectDB();

        const { subject, batch, examType, semester, images, description, uploadedBy } = await req.json();

        if (!subject || !batch || !examType || !semester || !images || images.length === 0) {
            return NextResponse.json(
                { error: "Required fields: subject, batch, examType, semester, images" },
                { status: 400 }
            );
        }

        const paper = new QuestionPaper({
            subject,
            batch,
            examType,
            semester,
            images,
            description,
            uploadedBy
        });

        await paper.save();

        return NextResponse.json({
            success: true,
            paperId: paper._id,
            message: "Question paper created successfully"
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/question-papers error:", error);
        return NextResponse.json({ error: "Failed to create question paper" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { buildQuestionPaperResponse, getQuestionPaperByTreePath } from "../../../../store";

export async function GET(req, { params }) {
    try {
        const { semester, batch, examType } = await params;
        const { searchParams } = new URL(req.url);
        const subject = searchParams.get("subject") || "";

        const paper = getQuestionPaperByTreePath(semester, batch, examType);

        if (!paper) {
            return NextResponse.json(
                { error: "Question paper not found" },
                { status: 404 }
            );
        }

        const paperData = buildQuestionPaperResponse(paper, subject);

        if (subject && paperData.subjects.length === 0) {
            return NextResponse.json(
                { error: "Subject not found for this question paper" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                paper: paperData,
                source: "static-json",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/question-papers/tree/[semester]/[batch]/[examType] error:", error);
        return NextResponse.json({ error: "Failed to fetch question paper" }, { status: 500 });
    }
}

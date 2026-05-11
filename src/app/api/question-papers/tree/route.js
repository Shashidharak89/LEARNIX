import { NextResponse } from "next/server";
import { buildQuestionPaperTree } from "../store";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const semester = searchParams.get("semester") || "";
        const batch = searchParams.get("batch") || "";
        const examType = searchParams.get("examType") || "";
        const subject = searchParams.get("subject") || "";
        const q = searchParams.get("q") || "";

        const tree = buildQuestionPaperTree({ semester, batch, examType, subject, q });

        return NextResponse.json(
            {
                success: true,
                totalSemesters: tree.length,
                tree,
                source: "static-json",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/question-papers/tree error:", error);
        return NextResponse.json({ error: "Failed to fetch question paper tree" }, { status: 500 });
    }
}

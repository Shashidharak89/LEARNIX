import { NextResponse } from "next/server";
import { listQuestionPapers } from "./store";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const batch = searchParams.get("batch") || "";
        const examType = searchParams.get("examType") || "";
        const semester = searchParams.get("semester") || "";
        const subject = searchParams.get("subject") || "";
        const q = searchParams.get("q") || "";

        const papers = await listQuestionPapers({ batch, examType, semester, subject, q }).map((paper) => ({
            id: paper.id,
            paperId: paper.paperId,
            semester: paper.semester,
            semesterLabel: paper.semesterLabel,
            batch: paper.batch,
            examType: paper.examType,
            totalSubjects: paper.totalSubjects,
            totalImages: paper.totalImages,
            subjectCount: paper.totalSubjects,
            subjects: paper.subjects.map((item) => ({
                subject: item.subject,
                imageCount: item.images.length,
            })),
            previewImages: paper.previewImages,
            visitlinks: paper.visitlinks,
            source: "static-json",
        }));

        return NextResponse.json(
            {
                success: true,
                total: papers.length,
                papers,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/question-papers error:", error);
        return NextResponse.json({ error: "Failed to fetch question papers" }, { status: 500 });
    }
}

export async function POST() {
    return NextResponse.json(
        { error: "This endpoint is read-only. Question papers are served from static backend JSON." },
        { status: 405 }
    );
}

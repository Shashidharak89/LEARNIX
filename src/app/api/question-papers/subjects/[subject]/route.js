import { NextResponse } from "next/server";
import { getSubjectAggregate } from "../../store";

export async function GET(req, { params }) {
    try {
        const raw = params?.subject || "";
        const subject = decodeURIComponent(raw);
        const data = getSubjectAggregate(subject);

        if (!data) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        return NextResponse.json({ subject: data });
    } catch (error) {
        console.error("GET /api/question-papers/subjects/[subject] error:", error);
        return NextResponse.json({ error: "Failed to fetch subject" }, { status: 500 });
    }
}

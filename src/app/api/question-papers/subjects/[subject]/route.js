import { NextResponse } from "next/server";
import { getSubjectAggregate } from "../../store";

export async function GET(req) {
    try {
        const pathname = req?.nextUrl?.pathname || "";
        const parts = pathname.split("/").filter(Boolean);
        const raw = parts[parts.length - 1] || "";
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

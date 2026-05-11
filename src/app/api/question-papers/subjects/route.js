import { NextResponse } from "next/server";
import { listAllSubjectNames } from "../store";

export async function GET() {
    try {
        const subjects = listAllSubjectNames();
        return NextResponse.json({ subjects });
    } catch (error) {
        console.error("GET /api/question-papers/subjects error:", error);
        return NextResponse.json({ error: "Failed to list subjects" }, { status: 500 });
    }
}

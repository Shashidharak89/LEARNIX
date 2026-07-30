import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMSemester from "@/models/SMSemester";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const semesters = await SMSemester.find({}).lean();
        const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);

        let scoredSemesters = semesters;
        if (words.length > 0) {
            scoredSemesters = semesters
                .map(s => {
                    const text = `Semester ${s.sem} ${s.sem} sem ${s.sem}`.toLowerCase();
                    let score = 0;
                    for (const word of words) {
                        if (text.includes(word)) {
                            score += 1;
                        }
                    }
                    return { s, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score || a.s.sem - b.s.sem)
                .map(item => item.s);
        } else {
            scoredSemesters.sort((a, b) => a.sem - b.sem);
        }

        const total = scoredSemesters.length;
        const records = scoredSemesters.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: records
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

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
        let matchedSemesters = semesters;

        if (q) {
            matchedSemesters = semesters.filter(s => {
                const semName = `Semester ${s.sem}`.toLowerCase();
                const semShort = `${s.sem} sem`.toLowerCase();
                const semVal = String(s.sem).toLowerCase();
                const term = q.toLowerCase();
                return semName.includes(term) || semShort.includes(term) || semVal.includes(term);
            });
        }

        const total = matchedSemesters.length;
        const sorted = matchedSemesters.sort((a, b) => a.sem - b.sem);
        const records = sorted.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: records
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

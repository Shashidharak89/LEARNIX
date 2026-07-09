import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMSubject from "@/models/SMSubject";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const collegeId = url.searchParams.get("collegeId");
        const courseId = url.searchParams.get("courseId");
        const semesterId = url.searchParams.get("semesterId");
        const batchId = url.searchParams.get("batchId");

        if (!collegeId || !courseId || !semesterId || !batchId) {
            return NextResponse.json({ success: false, error: "collegeId, courseId, semesterId, and batchId query parameters are required" }, { status: 400 });
        }

        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const query = { 
            college: collegeId, 
            course: courseId, 
            sem: semesterId, 
            batch: batchId 
        };

        const [records, total] = await Promise.all([
            SMSubject.find(query).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
            SMSubject.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: records
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

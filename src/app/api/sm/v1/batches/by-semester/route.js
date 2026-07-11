import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMBatch from "@/models/SMBatch";
import SMSubject from "@/models/SMSubject";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const collegeId = url.searchParams.get("collegeId");
        const courseId = url.searchParams.get("courseId");
        const semesterId = url.searchParams.get("semesterId");

        if (!semesterId) {
            return NextResponse.json({ success: false, error: "semesterId query parameter is required" }, { status: 400 });
        }

        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const subjectQuery = { sem: semesterId };
        if (collegeId) {
            subjectQuery.college = collegeId;
        }
        if (courseId) {
            subjectQuery.course = courseId;
        }

        const subjects = await SMSubject.find(subjectQuery).select("batch").lean();
        const batchIds = [...new Set(subjects.map(s => s.batch?.toString()).filter(Boolean))];

        const query = { _id: { $in: batchIds } };

        const [records, total] = await Promise.all([
            SMBatch.find(query).sort({ startyear: 1 }).skip(skip).limit(limit).lean(),
            SMBatch.countDocuments(query)
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

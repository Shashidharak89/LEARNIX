import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMSemester from "@/models/SMSemester";
import SMSubject from "@/models/SMSubject";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const collegeId = url.searchParams.get("collegeId");
        const courseId = url.searchParams.get("courseId");

        if (!courseId) {
            return NextResponse.json({ success: false, error: "courseId query parameter is required" }, { status: 400 });
        }

        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const subjectQuery = { course: courseId };
        if (collegeId) {
            subjectQuery.college = collegeId;
        }

        const subjects = await SMSubject.find(subjectQuery).select("sem").lean();
        const semesterIds = [...new Set(subjects.map(s => s.sem?.toString()).filter(Boolean))];

        const query = { _id: { $in: semesterIds } };

        const [records, total] = await Promise.all([
            SMSemester.find(query).sort({ sem: 1 }).skip(skip).limit(limit).lean(),
            SMSemester.countDocuments(query)
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

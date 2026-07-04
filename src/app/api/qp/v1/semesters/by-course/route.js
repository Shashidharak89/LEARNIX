import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPSemesters from "@/models/QPSemesters";
import QPSubjects from "@/models/QPSubjects";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;
        
        const collegeId = url.searchParams.get("collegeId");
        const courseId = url.searchParams.get("courseId");

        if (!collegeId || !courseId) {
            return NextResponse.json({ success: false, error: "collegeId and courseId query parameters are required" }, { status: 400 });
        }

        // Find all subjects for this college and course to determine which semesters exist
        const subjects = await QPSubjects.find({ college: collegeId, course: courseId }).select("semester").lean();
        const semesterIds = [...new Set(subjects.map(s => s.semester?.toString()).filter(Boolean))];

        const query = { _id: { $in: semesterIds } };

        const [records, total] = await Promise.all([
            QPSemesters.find(query).sort({ semesterNumber: 1 }).skip(skip).limit(limit).lean(),
            QPSemesters.countDocuments(query)
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

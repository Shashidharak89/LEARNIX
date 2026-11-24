import { stripKeywords } from "@/lib/sanitizeKeywords";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPSemesters from "@/models/QPSemesters";
import QPSubjects from "@/models/QPSubjects";
import QPColleges from "@/models/QPColleges";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;
        
        const collegeId = url.searchParams.get("collegeId");
        const universityId = url.searchParams.get("universityId");
        const courseId = url.searchParams.get("courseId");
        const q = (url.searchParams.get("q") || "").trim();

        const subjectFilter = {};
        if (collegeId) {
            subjectFilter.college = collegeId;
        } else if (universityId) {
            const colleges = await QPColleges.find({ university: universityId }).select("_id").lean();
            const collegeIds = colleges.map(c => c._id);
            subjectFilter.college = { $in: collegeIds };
        }
        if (courseId) {
            subjectFilter.course = courseId;
        }

        let query = {};
        if (collegeId || universityId || courseId) {
            const subjects = await QPSubjects.find(subjectFilter).select("semester").lean();
            const semesterIds = [...new Set(subjects.map(s => s.semester?.toString()).filter(Boolean))];
            query._id = { $in: semesterIds };
        }

        if (q) {
            const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const orConditions = [
                { keywords: { $regex: escaped, $options: "i" } }
            ];
            const num = parseInt(q.replace(/\D/g, ""), 10);
            if (!isNaN(num)) {
                orConditions.push({ semesterNumber: num });
            }
            query.$or = orConditions;
        }

        const [records, total] = await Promise.all([
            QPSemesters.find(query).sort({ semesterNumber: 1 }).skip(skip).limit(limit).lean(),
            QPSemesters.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: stripKeywords(records)
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

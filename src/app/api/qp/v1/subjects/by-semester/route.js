import { stripKeywords } from "@/lib/sanitizeKeywords";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
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
        const courseId = url.searchParams.get("courseId");
        const semesterId = url.searchParams.get("semesterId");
        const universityId = url.searchParams.get("universityId");
        const q = (url.searchParams.get("q") || "").trim();

        const query = {};

        if (q) {
            query.name = { $regex: q, $options: "i" };
        }

        if (collegeId) {
            query.college = collegeId;
        } else if (universityId) {
            const collegesUnderUni = await QPColleges.find({ university: universityId }).select("_id").lean();
            const collegeIds = collegesUnderUni.map(c => c._id);
            if (collegeIds.length > 0) {
                query.college = { $in: collegeIds };
            }
        }

        if (courseId) {
            query.course = courseId;
        }

        if (semesterId) {
            query.semester = semesterId;
        }

        const [records, total] = await Promise.all([
            QPSubjects.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
            QPSubjects.countDocuments(query)
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

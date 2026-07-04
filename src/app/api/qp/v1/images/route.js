import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPImages from "@/models/QPImages";
import QPSubjects from "@/models/QPSubjects";
import QPBatches from "@/models/QPBatches";
import QPExamType from "@/models/QPExamType";
import QPColleges from "@/models/QPColleges";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const subjectId = url.searchParams.get("subjectId");
        const collegeId = url.searchParams.get("collegeId");
        const batchId = url.searchParams.get("batchId");
        const examTypeId = url.searchParams.get("examTypeId");
        const courseId = url.searchParams.get("courseId");
        const semesterId = url.searchParams.get("semesterId");
        
        const query = {};
        if (subjectId) query.subject = subjectId;
        if (collegeId) query.college = collegeId;
        if (batchId) query.batch = batchId;
        if (examTypeId) query.examtype = examTypeId;

        // If no explicit subjectId is provided but course/semester is, restrict subjects
        if (!subjectId && (courseId || semesterId)) {
            const subjectQuery = {};
            if (collegeId) subjectQuery.college = collegeId;
            if (courseId) subjectQuery.course = courseId;
            if (semesterId) subjectQuery.semester = semesterId;
            
            const validSubjects = await QPSubjects.find(subjectQuery).select('_id').lean();
            const validSubjectIds = validSubjects.map(s => s._id);
            query.subject = { $in: validSubjectIds };
        }

        const [records, total] = await Promise.all([
            QPImages.find(query)
                .populate("subject")
                .populate("batch")
                .populate("examtype")
                .populate("college")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            QPImages.countDocuments(query)
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

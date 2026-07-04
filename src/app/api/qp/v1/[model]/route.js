import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPUniversities from "@/models/QPUniversities";
import QPColleges from "@/models/QPColleges";
import QPSemesters from "@/models/QPSemesters";
import QPCourse from "@/models/QPCourse";
import QPSubjects from "@/models/QPSubjects";
import QPImages from "@/models/QPImages";
import QPBatches from "@/models/QPBatches";
import QPExamType from "@/models/QPExamType";

const modelMap = {
    universities: QPUniversities,
    colleges: QPColleges,
    semesters: QPSemesters,
    courses: QPCourse,
    subjects: QPSubjects,
    images: QPImages,
    batches: QPBatches,
    examtypes: QPExamType
};

export async function GET(req, { params }) {
    try {
        await connectDB();
        const { model } = await params;
        const url = new URL(req.url);
        
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        if (!modelMap[model]) {
            return NextResponse.json({ success: false, message: "Invalid resource type" }, { status: 400 });
        }

        const Model = modelMap[model];
        const query = {};

        // Dynamic Filtering
        if (model === "colleges") {
            const universityId = url.searchParams.get("universityId");
            if (universityId) query.university = universityId;
        }

        if (model === "subjects") {
            const courseId = url.searchParams.get("courseId");
            const collegeId = url.searchParams.get("collegeId");
            const semesterId = url.searchParams.get("semesterId");
            const universityId = url.searchParams.get("universityId");

            if (courseId) query.course = courseId;
            if (collegeId) query.college = collegeId;
            if (semesterId) query.semester = semesterId;

            // To filter subjects by university, we need to find colleges belonging to the university first
            if (universityId) {
                const colleges = await QPColleges.find({ university: universityId }, "_id").lean();
                const collegeIds = colleges.map(c => c._id);
                // If collegeId is already specified, it must intersect, but for simplicity we just override or merge
                query.college = collegeId ? { $in: [collegeId].filter(id => collegeIds.some(cid => cid.toString() === id)) } : { $in: collegeIds };
            }
        }

        const [records, total] = await Promise.all([
            Model.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Model.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: records
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

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
        
        const query = {};
        if (subjectId) query.subject = subjectId;
        if (collegeId) query.college = collegeId;
        if (batchId) query.batch = batchId;

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

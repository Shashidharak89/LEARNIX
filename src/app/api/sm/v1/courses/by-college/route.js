import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMCourse from "@/models/SMCourse";
import SMSubject from "@/models/SMSubject";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const collegeId = url.searchParams.get("collegeId");

        if (!collegeId) {
            return NextResponse.json({ success: false, error: "collegeId query parameter is required" }, { status: 400 });
        }

        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const subjects = await SMSubject.find({ college: collegeId }).select("course").lean();
        const courseIds = [...new Set(subjects.map(s => s.course?.toString()).filter(Boolean))];

        const query = { _id: { $in: courseIds } };

        const [records, total] = await Promise.all([
            SMCourse.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
            SMCourse.countDocuments(query)
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

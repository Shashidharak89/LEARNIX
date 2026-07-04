import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPUniversities from "@/models/QPUniversities";
import QPColleges from "@/models/QPColleges";
import QPSemesters from "@/models/QPSemesters";
import QPCourse from "@/models/QPCourse";
import QPSubjects from "@/models/QPSubjects";

const modelMap = {
    universities: { model: QPUniversities, fields: ["name", "city", "state", "district"] },
    colleges: { model: QPColleges, fields: ["name", "location"] },
    semesters: { model: QPSemesters, fields: [] }, // Semesters usually don't have string search, but we can search numbers if needed
    courses: { model: QPCourse, fields: ["name"] },
    subjects: { model: QPSubjects, fields: ["name"] }
};

export async function GET(req, { params }) {
    try {
        await connectDB();
        const { model } = params;
        const url = new URL(req.url);
        
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        if (!modelMap[model]) {
            return NextResponse.json({ success: false, message: "Invalid resource type for search" }, { status: 400 });
        }

        const { model: Model, fields } = modelMap[model];
        const query = {};

        if (q && fields.length > 0) {
            query.$or = fields.map(field => ({
                [field]: { $regex: q, $options: "i" }
            }));
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

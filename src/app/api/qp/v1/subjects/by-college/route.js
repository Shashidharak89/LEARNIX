import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPSubjects from "@/models/QPSubjects";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const collegeId = url.searchParams.get("collegeId");
        const query = collegeId ? { college: collegeId } : {};

        const [records, total] = await Promise.all([
            QPSubjects.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            QPSubjects.countDocuments(query)
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

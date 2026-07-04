import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPColleges from "@/models/QPColleges";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;
        
        const universityId = url.searchParams.get("universityId");
        const query = universityId ? { university: universityId } : {};

        const [records, total] = await Promise.all([
            QPColleges.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            QPColleges.countDocuments(query)
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

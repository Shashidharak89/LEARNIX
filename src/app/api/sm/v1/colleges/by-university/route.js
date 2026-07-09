import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMCollege from "@/models/SMCollege";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const universityId = url.searchParams.get("universityId");
        
        if (!universityId) {
            return NextResponse.json({ success: false, error: "universityId query parameter is required" }, { status: 400 });
        }

        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const query = { university: universityId };

        const [records, total] = await Promise.all([
            SMCollege.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
            SMCollege.countDocuments(query)
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

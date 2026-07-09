import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMFiles from "@/models/SMFiles";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            SMFiles.find({}).populate({
                path: 'sub',
                populate: [
                    { path: 'course' },
                    { path: 'sem' },
                    { path: 'batch' },
                    { path: 'college', populate: { path: 'university' } }
                ]
            }).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
            SMFiles.countDocuments({})
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

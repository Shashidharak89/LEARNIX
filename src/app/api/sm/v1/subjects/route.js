import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMSubject from "@/models/SMSubject";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            SMSubject.find({}).populate("college").populate("course").populate("sem").populate("batch").sort({ name: 1 }).skip(skip).limit(limit).lean(),
            SMSubject.countDocuments({})
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

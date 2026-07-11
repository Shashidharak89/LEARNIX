import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMUniversity from "@/models/SMUniversity";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const query = q ? {
            $or: [
                { name: { $regex: q, $options: "i" } },
                { city: { $regex: q, $options: "i" } },
                { district: { $regex: q, $options: "i" } }
            ]
        } : {};

        const [records, total] = await Promise.all([
            SMUniversity.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
            SMUniversity.countDocuments(query)
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

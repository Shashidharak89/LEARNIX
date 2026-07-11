import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMCollege from "@/models/SMCollege";
import SMUniversity from "@/models/SMUniversity";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        let query = {};
        if (q) {
            const matchingUnis = await SMUniversity.find({ name: { $regex: q, $options: "i" } }).select("_id").lean();
            const uniIds = matchingUnis.map(u => u._id);
            query = {
                $or: [
                    { name: { $regex: q, $options: "i" } },
                    { location: { $regex: q, $options: "i" } },
                    { university: { $in: uniIds } }
                ]
            };
        }

        const [records, total] = await Promise.all([
            SMCollege.find(query).populate("university").sort({ name: 1 }).skip(skip).limit(limit).lean(),
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

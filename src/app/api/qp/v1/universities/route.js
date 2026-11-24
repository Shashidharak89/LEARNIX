import { stripKeywords } from "@/lib/sanitizeKeywords";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QPUniversities from "@/models/QPUniversities";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const q = (url.searchParams.get("q") || "").trim();
        const query = {};
        if (q) {
            const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.$or = [
                { name: { $regex: escaped, $options: "i" } },
                { city: { $regex: escaped, $options: "i" } },
                { state: { $regex: escaped, $options: "i" } },
                { district: { $regex: escaped, $options: "i" } },
                { keywords: { $regex: escaped, $options: "i" } }
            ];
        }

        const [records, total] = await Promise.all([
            QPUniversities.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
            QPUniversities.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: stripKeywords(records)
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

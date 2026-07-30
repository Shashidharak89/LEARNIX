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

        const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
        let query = {};
        if (words.length > 0) {
            const orConditions = [];
            words.forEach(w => {
                const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                orConditions.push(
                    { name: { $regex: escaped, $options: "i" } },
                    { city: { $regex: escaped, $options: "i" } },
                    { district: { $regex: escaped, $options: "i" } }
                );
            });
            query = { $or: orConditions };
        }

        const allRecords = await SMUniversity.find(query).lean();

        let scoredRecords = allRecords;
        if (words.length > 0) {
            scoredRecords = allRecords
                .map(r => {
                    let score = 0;
                    const text = `${r.name || ""} ${r.city || ""} ${r.district || ""}`.toLowerCase();
                    for (const word of words) {
                        if (text.includes(word)) {
                            score += 1;
                        }
                    }
                    return { r, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score || (a.r.name || "").localeCompare(b.r.name || ""))
                .map(item => item.r);
        } else {
            scoredRecords.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }

        const total = scoredRecords.length;
        const records = scoredRecords.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: records
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

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

        const rawQuery = q.trim();
        const cleanQuery = rawQuery.toLowerCase();
        const words = cleanQuery.split(/\s+/).filter(Boolean);

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
                    const uniName = (r.name || "").toLowerCase();
                    const city = (r.city || "").toLowerCase();
                    const district = (r.district || "").toLowerCase();
                    const text = `${uniName} ${city} ${district}`;

                    if (text.includes(cleanQuery)) score += 20;
                    if (uniName.startsWith(cleanQuery)) score += 10;

                    for (const word of words) {
                        if (uniName.includes(word)) {
                            score += 5;
                        } else if (city.includes(word) || district.includes(word)) {
                            score += 2;
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

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SMBatch from "@/models/SMBatch";

export async function GET(req) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const q = url.searchParams.get("q") || "";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 20;
        const skip = (page - 1) * limit;

        const batches = await SMBatch.find({}).lean();
        const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);

        let scoredBatches = batches;
        if (words.length > 0) {
            scoredBatches = batches
                .map(b => {
                    const text = `Batch ${b.startyear}-${b.endyear} ${b.startyear} ${b.endyear}`.toLowerCase();
                    let score = 0;
                    for (const word of words) {
                        if (text.includes(word)) {
                            score += 1;
                        }
                    }
                    return { b, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score || b.b.startyear - a.b.startyear)
                .map(item => item.b);
        } else {
            scoredBatches.sort((a, b) => b.startyear - a.startyear);
        }

        const total = scoredBatches.length;
        const records = scoredBatches.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: records
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

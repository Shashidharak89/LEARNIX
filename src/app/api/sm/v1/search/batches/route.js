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
        let matchedBatches = batches;

        if (q) {
            matchedBatches = batches.filter(b => {
                const batchName = `Batch ${b.startyear}-${b.endyear}`.toLowerCase();
                const startStr = String(b.startyear);
                const endStr = String(b.endyear);
                const term = q.toLowerCase();
                return batchName.includes(term) || startStr.includes(term) || endStr.includes(term);
            });
        }

        const total = matchedBatches.length;
        const sorted = matchedBatches.sort((a, b) => b.startyear - a.startyear);
        const records = sorted.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: records
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

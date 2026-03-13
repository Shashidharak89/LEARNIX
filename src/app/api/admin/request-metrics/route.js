import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import RequestMetric from "@/models/RequestMetric";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

async function getCallerFromBearer(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return await User.findById(decoded.userId).lean();
  } catch {
    return null;
  }
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

const ZERO = { works: 0, worksmain: 0, quote: 0 };

export const GET = async (req) => {
  try {
    await connectDB();

    const caller = await getCallerFromBearer(req);
    if (!caller || (caller.role !== "admin" && caller.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const dateParam = searchParams.get("date");
    const skip = (page - 1) * limit;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    let selectedDate = null;
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!Number.isNaN(parsed.getTime())) {
        selectedDate = parsed;
      }
    }
    if (!selectedDate) selectedDate = now;

    const selectedStart = startOfDay(selectedDate);
    const selectedEnd = endOfDay(selectedDate);

    const [totalsAgg, todayDoc, selectedDoc, historyTotal, historyRecords] = await Promise.all([
      RequestMetric.aggregate([
        {
          $group: {
            _id: null,
            works: { $sum: "$works" },
            worksmain: { $sum: "$worksmain" },
            quote: { $sum: "$quote" },
          },
        },
      ]),
      RequestMetric.findOne({ datetime: { $gte: todayStart, $lte: todayEnd } })
        .select("works worksmain quote datetime updatedAt")
        .lean(),
      RequestMetric.findOne({ datetime: { $gte: selectedStart, $lte: selectedEnd } })
        .select("works worksmain quote datetime updatedAt")
        .lean(),
      RequestMetric.countDocuments({}),
      RequestMetric.find({})
        .sort({ datetime: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select("works worksmain quote datetime updatedAt")
        .lean(),
    ]);

    const totals = totalsAgg[0]
      ? { works: totalsAgg[0].works || 0, worksmain: totalsAgg[0].worksmain || 0, quote: totalsAgg[0].quote || 0 }
      : ZERO;

    return NextResponse.json({
      totals,
      today: todayDoc ? { ...ZERO, ...todayDoc } : ZERO,
      selectedDate: selectedDoc ? { ...ZERO, ...selectedDoc } : ZERO,
      selectedDateKey: selectedStart.toISOString().slice(0, 10),
      history: historyRecords,
      paging: {
        page,
        limit,
        total: historyTotal,
        totalPages: Math.ceil(historyTotal / limit),
      },
    });
  } catch (err) {
    console.error("Admin request-metrics fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch request metrics" }, { status: 500 });
  }
};

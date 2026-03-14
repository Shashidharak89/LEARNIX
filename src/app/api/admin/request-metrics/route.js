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

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseRangeDays(value) {
  const parsed = parseInt(value || "7", 10);
  if ([7, 30, 90].includes(parsed)) return parsed;
  return 7;
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
    const rangeDays = parseRangeDays(searchParams.get("rangeDays"));
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

    const trendStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (rangeDays - 1)));
    const trendEnd = todayEnd;

    const [totalsAgg, todayDoc, selectedDoc, historyTotal, historyRecords, trendDocs] = await Promise.all([
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
      RequestMetric.find({ datetime: { $gte: trendStart, $lte: trendEnd } })
        .sort({ datetime: 1, _id: 1 })
        .select("works worksmain quote datetime")
        .lean(),
    ]);

    const totals = totalsAgg[0]
      ? { works: totalsAgg[0].works || 0, worksmain: totalsAgg[0].worksmain || 0, quote: totalsAgg[0].quote || 0 }
      : ZERO;

    const trendByDate = new Map(
      trendDocs.map((record) => [dateKey(new Date(record.datetime)), { ...ZERO, ...record }])
    );

    const trend = [];
    for (let index = 0; index < rangeDays; index += 1) {
      const day = new Date(trendStart.getFullYear(), trendStart.getMonth(), trendStart.getDate() + index);
      const key = dateKey(day);
      const source = trendByDate.get(key) || ZERO;
      trend.push({
        dateKey: key,
        datetime: day,
        works: source.works || 0,
        worksmain: source.worksmain || 0,
        quote: source.quote || 0,
      });
    }

    const selectedDateValue = selectedDoc ? { ...ZERO, ...selectedDoc } : ZERO;

    return NextResponse.json({
      totals,
      today: todayDoc ? { ...ZERO, ...todayDoc } : ZERO,
      dayStats: selectedDateValue,
      selectedDate: selectedDoc ? { ...ZERO, ...selectedDoc } : ZERO,
      selectedDateKey: selectedStart.toISOString().slice(0, 10),
      trend: {
        rangeDays,
        records: trend,
      },
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

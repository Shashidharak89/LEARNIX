import RequestMetric from "@/models/RequestMetric";

const FIELDS = new Set(["works", "worksmain", "quote"]);

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function incrementRequestMetric(field) {
  if (!FIELDS.has(field)) return;

  const now = new Date();
  const today = startOfToday();

  await RequestMetric.findOneAndUpdate(
    { datetime: today },
    {
      $setOnInsert: { datetime: today, works: 0, worksmain: 0, quote: 0, createdAt: now },
      $inc: { [field]: 1 },
      $set: { updatedAt: now },
    },
    { upsert: true, new: true }
  );
}

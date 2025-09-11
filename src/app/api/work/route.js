import { createWork, getAllWorks } from "@/controllers/workController";

export async function GET() {
  return getAllWorks();
}

export async function POST(req) {
  return createWork(req);
}

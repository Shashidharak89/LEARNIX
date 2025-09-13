import { createWork, getAllWorks } from "@/controllers/workController";

export async function POST(request) {
  return createWork(request);
}

export async function GET() {
  return getAllWorks();
}

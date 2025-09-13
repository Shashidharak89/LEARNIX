import { getWorkById } from "@/controllers/workController";

export async function GET(request, { params }) {
  return getWorkById(request, { params });
}

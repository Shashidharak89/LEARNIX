import { addContent } from "@/controllers/workController";

export async function POST(request, { params }) {
  return addContent(request, { params });
}

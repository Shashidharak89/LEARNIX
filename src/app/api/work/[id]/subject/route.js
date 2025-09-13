import { addSubject } from "@/controllers/workController";

export async function POST(request, { params }) {
  return addSubject(request, { params });
}

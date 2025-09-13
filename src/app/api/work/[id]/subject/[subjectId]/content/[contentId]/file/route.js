import { addFileToContent } from "@/controllers/workController";

export const config = {
  // ensure body parsing not applied by Next.js so we can use formData()
  api: {
    bodyParser: false,
  },
};

export async function POST(request, { params }) {
  return addFileToContent(request, { params });
}

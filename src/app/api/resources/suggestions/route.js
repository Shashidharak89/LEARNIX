import { GET as getSubjects } from "./subjects/route";
import { GET as getTopics } from "./topics/route";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "topics" || searchParams.has("subject")) {
    return getTopics(request);
  }

  return getSubjects(request);
}

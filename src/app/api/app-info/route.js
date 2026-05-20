import { NextResponse } from "next/server";

export async function GET() {
  const version = "1.2.4";
  const link = "https://play.google.com/store/apps/details?id=com.shashidharak.learnix";

  return NextResponse.json({
    version,
    link
  });
}

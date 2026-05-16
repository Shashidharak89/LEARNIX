import { NextResponse } from "next/server";

export async function GET() {
  const version = "1.2.0";
  const link = "https://raw.githubusercontent.com/Shashidharak89/My-Android-Applications/main/Learnix/Learnix-v1.2.0.apk";

  return NextResponse.json({
    version,
    link
  });
}

import { NextResponse } from "next/server";

export async function GET() {
  const version = "1.2.1";
  const link = "https://raw.github.com/Shashidharak89/My-Android-Applications/main/Learnix/Learnix-v1.2.1.apk";

  return NextResponse.json({
    version,
    link
  });
}

import { NextResponse } from "next/server";

export async function GET() {
  const latestVersion = "1.3.12";
  const validVersion = "1.3.11";
  const appLink = "https://play.google.com/store/apps/details?id=com.shashidharak.learnix";

  return NextResponse.json({
    version: latestVersion, // For backward compatibility
    link: appLink, // For backward compatibility
    latestVersion,
    validVersion,
    appLink
  });
}

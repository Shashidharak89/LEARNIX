import { NextResponse } from "next/server";
import { docClient, LANGUAGES_TABLE } from "@/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

const FALLBACK_LANGUAGES = [
  {
    languageId: "javascript",
    name: "JavaScript",
    version: "ES2024 / Node.js",
    monaco: "javascript",
    extension: "js",
    executionMode: "browser",
    order: 1,
    isActive: true,
  },
  {
    languageId: "java",
    name: "Java",
    version: "OpenJDK 25",
    monaco: "java",
    extension: "java",
    executionMode: "server",
    order: 2,
    isActive: true,
  },
];

export async function GET() {
  try {
    const res = await docClient.send(
      new ScanCommand({
        TableName: LANGUAGES_TABLE,
      })
    );

    let languages = res.Items || [];
    if (languages.length === 0) {
      languages = FALLBACK_LANGUAGES;
    }

    languages = languages
      .filter((lang) => lang.isActive !== false)
      .sort((a, b) => (a.order || 99) - (b.order || 99));

    return NextResponse.json({
      success: true,
      languages,
    });
  } catch (err) {
    console.error("Languages fetch error:", err);
    // Return fallback so UI never breaks
    return NextResponse.json({
      success: true,
      languages: FALLBACK_LANGUAGES,
    });
  }
}

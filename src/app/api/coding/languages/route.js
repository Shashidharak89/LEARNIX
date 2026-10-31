import { NextResponse } from "next/server";
import { docClient, LANGUAGES_TABLE } from "@/lib/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

const FALLBACK_LANGUAGES = [
  {
    languageId: "java",
    name: "Java",
    version: "OpenJDK 25",
    monaco: "java",
    extension: "java",
    order: 1,
    isActive: true,
  },
  {
    languageId: "javascript",
    name: "JavaScript",
    version: "ES2024",
    monaco: "javascript",
    extension: "js",
    order: 2,
    isActive: true,
  },
  {
    languageId: "python",
    name: "Python",
    version: "3.14",
    monaco: "python",
    extension: "py",
    order: 3,
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
    } else {
      // Ensure python exists in the list even if DB hasn't been seeded yet
      const hasPython = languages.some((l) => l.languageId === "python");
      if (!hasPython) {
        languages.push(FALLBACK_LANGUAGES.find((l) => l.languageId === "python"));
      }
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

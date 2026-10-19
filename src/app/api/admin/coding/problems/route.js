import { NextResponse } from "next/server";
import { verifyAdminCaller } from "@/lib/adminAuth";
import { docClient, PROBLEMS_TABLE, TESTCASES_TABLE } from "@/lib/dynamodb";
import { ScanCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const scanRes = await docClient.send(
      new ScanCommand({
        TableName: PROBLEMS_TABLE,
      })
    );

    const problems = scanRes.Items || [];
    problems.sort((a, b) => (a.order || 999) - (b.order || 999));

    // For each problem, get testcase count
    const enriched = await Promise.all(
      problems.map(async (p) => {
        try {
          const tcRes = await docClient.send(
            new QueryCommand({
              TableName: TESTCASES_TABLE,
              KeyConditionExpression: "problemId = :pid",
              ExpressionAttributeValues: { ":pid": p.problemId },
              Select: "COUNT",
            })
          );
          return {
            ...p,
            testCasesCount: tcRes.Count || 0,
          };
        } catch {
          return { ...p, testCasesCount: 0 };
        }
      })
    );

    return NextResponse.json({ success: true, problems: enriched });
  } catch (err) {
    console.error("Admin coding problems fetch error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch problems" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      slug,
      difficulty = "Easy",
      tags = [],
      description = "",
      inputFormat = "",
      outputFormat = "",
      constraints = [],
      functionName = "solution",
      parameters = [],
      returnType = "any",
      templates = {},
      order = 1,
      isActive = true,
      testCases = [],
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const cleanSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const problemId = cleanSlug || `problem-${Date.now()}`;
    const now = new Date().toISOString();

    // Default javascript boilerplate template if not specified
    const finalTemplates = {
      javascript:
        templates.javascript ||
        `/**
 * ${title}
 * 
${parameters.map((p) => ` * @param {${p.type || "any"}} ${p.name || "arg"}`).join("\n")}
 * @return {${returnType || "any"}}
 */
function ${functionName}(${parameters.map((p) => p.name || "arg").join(", ")}) {
    // Write your code here
    
}`,
      ...templates,
    };

    const problemItem = {
      problemId,
      slug: cleanSlug,
      title,
      difficulty,
      tags: Array.isArray(tags) ? tags : [],
      description,
      inputFormat,
      outputFormat,
      constraints: Array.isArray(constraints) ? constraints : [],
      functionName,
      parameters: Array.isArray(parameters) ? parameters : [],
      returnType,
      templates: finalTemplates,
      order: Number(order) || 1,
      isActive: Boolean(isActive),
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: PROBLEMS_TABLE,
        Item: problemItem,
      })
    );

    // Save test cases into normalized LearnixCodingTestCases table
    if (Array.isArray(testCases) && testCases.length > 0) {
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const tcId = tc.testCaseId || `tc_${String(i + 1).padStart(2, "0")}`;

        let parsedInput = tc.input;
        if (typeof parsedInput === "string") {
          try {
            parsedInput = JSON.parse(parsedInput);
          } catch {
            // keep as string or wrap
          }
        }

        let parsedExpected = tc.expectedOutput;
        if (typeof parsedExpected === "string") {
          try {
            parsedExpected = JSON.parse(parsedExpected);
          } catch {
            // keep as string
          }
        }

        await docClient.send(
          new PutCommand({
            TableName: TESTCASES_TABLE,
            Item: {
              problemId,
              testCaseId: tcId,
              order: tc.order || i + 1,
              input: parsedInput,
              rawInput: tc.rawInput || (Array.isArray(parsedInput) ? parsedInput.join(", ") : String(parsedInput)),
              expectedOutput: parsedExpected,
              isSample: Boolean(tc.isSample),
              explanation: tc.explanation || "",
              createdAt: now,
            },
          })
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Problem created successfully",
      problem: problemItem,
    });
  } catch (err) {
    console.error("Admin problem creation error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create problem" },
      { status: 500 }
    );
  }
}

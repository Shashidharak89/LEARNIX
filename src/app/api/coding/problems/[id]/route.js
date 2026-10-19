import { NextResponse } from "next/server";
import { docClient, PROBLEMS_TABLE, TESTCASES_TABLE } from "@/lib/dynamodb";
import { GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing problem identifier" }, { status: 400 });
    }

    // Try direct lookup by problemId first
    let problemRes = await docClient.send(
      new GetCommand({
        TableName: PROBLEMS_TABLE,
        Key: { problemId: id },
      })
    );

    let problem = problemRes.Item;

    // If not found by exact problemId, search by slug
    if (!problem) {
      const scanRes = await docClient.send(
        new ScanCommand({
          TableName: PROBLEMS_TABLE,
          FilterExpression: "slug = :slug",
          ExpressionAttributeValues: {
            ":slug": id,
          },
        })
      );
      if (scanRes.Items && scanRes.Items.length > 0) {
        problem = scanRes.Items[0];
      }
    }

    if (!problem) {
      return NextResponse.json({ success: false, error: "Problem not found" }, { status: 404 });
    }

    // Query test cases for this problem (only return isSample === true for security)
    const testCasesRes = await docClient.send(
      new QueryCommand({
        TableName: TESTCASES_TABLE,
        KeyConditionExpression: "problemId = :pid",
        ExpressionAttributeValues: {
          ":pid": problem.problemId,
        },
      })
    );

    const allTestCases = testCasesRes.Items || [];
    // Sort by order
    allTestCases.sort((a, b) => (a.order || 999) - (b.order || 999));

    // Public gets sample cases with input and expected output
    const sampleCases = allTestCases
      .filter((tc) => tc.isSample === true)
      .map((tc) => ({
        testCaseId: tc.testCaseId,
        order: tc.order,
        input: tc.input,
        rawInput: tc.rawInput,
        expectedOutput: tc.expectedOutput,
        explanation: tc.explanation || null,
        isSample: true,
      }));

    return NextResponse.json({
      success: true,
      problem: {
        problemId: problem.problemId,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        tags: problem.tags || [],
        description: problem.description,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints || [],
        functionName: problem.functionName,
        parameters: problem.parameters || [],
        returnType: problem.returnType,
        templates: problem.templates || {},
        totalTestCasesCount: allTestCases.length,
        sampleCases,
      },
    });
  } catch (err) {
    console.error("Failed to fetch problem:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching problem" },
      { status: 500 }
    );
  }
}

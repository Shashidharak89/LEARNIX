import { NextResponse } from "next/server";
import { docClient, PROBLEMS_TABLE, TESTCASES_TABLE } from "@/lib/dynamodb";
import { GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { executeCode } from "@/lib/codeRunner";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { problemId, code, mode = "run", customInput } = body;

    if (!problemId) {
      return NextResponse.json({ success: false, error: "problemId is required" }, { status: 400 });
    }
    if (!code || typeof code !== "string") {
      return NextResponse.json({ success: false, error: "code string is required" }, { status: 400 });
    }

    // Lookup problem
    let problemRes = await docClient.send(
      new GetCommand({
        TableName: PROBLEMS_TABLE,
        Key: { problemId },
      })
    );

    let problem = problemRes.Item;
    if (!problem) {
      // Try slug
      const scanRes = await docClient.send(
        new ScanCommand({
          TableName: PROBLEMS_TABLE,
          FilterExpression: "slug = :slug",
          ExpressionAttributeValues: { ":slug": problemId },
        })
      );
      if (scanRes.Items && scanRes.Items.length > 0) {
        problem = scanRes.Items[0];
      }
    }

    if (!problem) {
      return NextResponse.json({ success: false, error: "Problem not found" }, { status: 404 });
    }

    // Query test cases
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
    allTestCases.sort((a, b) => (a.order || 999) - (b.order || 999));

    let targetCases = [];

    if (customInput !== undefined && customInput !== null) {
      // Run with custom input
      targetCases = [
        {
          testCaseId: "custom_input",
          order: 1,
          input: customInput,
          rawInput: Array.isArray(customInput) ? customInput.join(", ") : String(customInput),
          expectedOutput: null,
          isSample: true,
        },
      ];
    } else if (mode === "run") {
      // Run only sample test cases
      targetCases = allTestCases.filter((tc) => tc.isSample === true);
      if (targetCases.length === 0) {
        // Fallback to first 2 testcases if no sample flag
        targetCases = allTestCases.slice(0, 2);
      }
    } else {
      // Submit mode: run ALL test cases (both sample and hidden)
      targetCases = allTestCases;
    }

    const executionResult = executeCode({
      userCode: code,
      functionName: problem.functionName || "addTwoNumbers",
      testCases: targetCases,
      timeoutMs: 2000,
      stopOnFailure: mode === "submit",
    });

    // In submit mode, sanitize hidden testcases if we don't want to expose hidden inputs/expectedOutputs
    const sanitizedResults = executionResult.results.map((res) => {
      if (mode === "submit" && !res.isSample && res.passed) {
        return {
          testCaseId: res.testCaseId,
          order: res.order,
          isSample: false,
          passed: true,
          runtimeMs: res.runtimeMs,
        };
      }
      return res;
    });

    return NextResponse.json({
      success: true,
      mode,
      status: executionResult.status,
      error: executionResult.error,
      totalRuntime: executionResult.totalRuntime,
      passedTestCases: executionResult.passedTestCases,
      totalTestCases: targetCases.length,
      allProblemsTestCasesCount: allTestCases.length,
      results: sanitizedResults,
    });
  } catch (err) {
    console.error("Execution error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute code" },
      { status: 500 }
    );
  }
}

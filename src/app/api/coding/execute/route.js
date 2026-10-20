import { NextResponse } from "next/server";
import { docClient, PROBLEMS_TABLE, TESTCASES_TABLE, SUBMISSIONS_TABLE } from "@/lib/dynamodb";
import { GetCommand, QueryCommand, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { executeCode } from "@/lib/codeRunner";
import { executeJavaCode } from "@/lib/javaRunner";
import { connectDB } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/authUser";

export const dynamic = "force-dynamic";

// In-memory rate limiting map: 1 run/submit per 10 seconds per user / IP
const rateLimitMap = new Map();

function checkRateLimit(callerKey) {
  const now = Date.now();
  const lastTime = rateLimitMap.get(callerKey);
  if (lastTime && now - lastTime < 10000) {
    const remainingMs = 10000 - (now - lastTime);
    return Math.ceil(remainingMs / 1000);
  }
  rateLimitMap.set(callerKey, now);

  // Periodic cleanup if map grows large
  if (rateLimitMap.size > 2000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now - v > 60000) rateLimitMap.delete(k);
    }
  }
  return 0;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { problemId, code, language = "javascript", mode = "run", customInput } = body;

    if (!problemId) {
      return NextResponse.json({ success: false, error: "problemId is required" }, { status: 400 });
    }
    if (!code || typeof code !== "string") {
      return NextResponse.json({ success: false, error: "code string is required" }, { status: 400 });
    }

    // Rate Limiting (10 seconds restriction)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown_client";
    const authHeader = req.headers.get("authorization") || "";
    const callerKey = authHeader ? `auth:${authHeader.slice(-24)}` : `ip:${clientIp}`;

    const cooldownRemaining = checkRateLimit(callerKey);
    if (cooldownRemaining > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${cooldownRemaining}s before running or submitting again. (10s restriction)`,
          cooldownRemaining,
        },
        { status: 429 }
      );
    }

    // Require authentication for submit mode
    let authUser = null;
    if (mode === "submit") {
      await connectDB();
      const authResult = await resolveAuthenticatedUser(req, { withMeta: true });
      if (!authResult?.user) {
        return NextResponse.json(
          {
            success: false,
            error: "Please log in to submit your solution. You can test your code freely with 'Run'.",
            requiresLogin: true,
          },
          { status: 401 }
        );
      }
      authUser = authResult.user;
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
      const numericId = parseInt(problemId, 10);
      if (!isNaN(numericId)) {
        const orderRes = await docClient.send(
          new ScanCommand({
            TableName: PROBLEMS_TABLE,
            FilterExpression: "#ord = :numId",
            ExpressionAttributeNames: { "#ord": "order" },
            ExpressionAttributeValues: { ":numId": numericId },
          })
        );
        if (orderRes.Items && orderRes.Items.length > 0) {
          problem = orderRes.Items[0];
        }
      }

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
        targetCases = allTestCases.slice(0, 3);
      }
    } else {
      // Submit mode: run ALL test cases (both sample and hidden)
      targetCases = allTestCases;
    }

    // Execute code. When submitting, stopOnFailure is false so that all test cases run and all passing ones are counted.
    const selectedLang = (language || "javascript").toLowerCase();
    let executionResult;

    if (selectedLang === "java") {
      executionResult = await executeJavaCode({
        userCode: code,
        functionName: problem.functionName || "addTwoNumbers",
        testCases: targetCases,
        timeoutMs: 12000,
        stopOnFailure: false,
      });
    } else {
      executionResult = executeCode({
        userCode: code,
        functionName: problem.functionName || "addTwoNumbers",
        testCases: targetCases,
        timeoutMs: 2500,
        stopOnFailure: false,
      });
    }

    // In submit mode, sanitize results for display
    const sanitizedResults = (executionResult.results || []).map((res) => {
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

    let submissionRecord = null;

    // In submit mode: persist submission details to DynamoDB
    if (mode === "submit" && authUser) {
      const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const submittedAt = new Date().toISOString();
      const userId = String(authUser._id || authUser.id);

      const submissionItem = {
        userId,
        submissionId,
        usn: authUser.usn || "",
        userName: authUser.name || "",
        userEmail: authUser.email || "",
        problemId: problem.problemId,
        problemTitle: problem.title,
        problemOrder: problem.order || 1,
        code,
        language: selectedLang,
        status: executionResult.status,
        error: executionResult.error || null,
        totalRuntime: executionResult.totalRuntime,
        passedTestCases: executionResult.passedTestCases,
        totalTestCases: targetCases.length,
        submittedAt,
        results: sanitizedResults,
      };

      await docClient.send(
        new PutCommand({
          TableName: SUBMISSIONS_TABLE,
          Item: submissionItem,
        })
      );

      submissionRecord = {
        submissionId,
        status: executionResult.status,
        passedTestCases: executionResult.passedTestCases,
        totalTestCases: targetCases.length,
        totalRuntime: executionResult.totalRuntime,
        submittedAt,
      };
    }

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
      submission: submissionRecord,
    });
  } catch (err) {
    console.error("Execution error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute code" },
      { status: 500 }
    );
  }
}

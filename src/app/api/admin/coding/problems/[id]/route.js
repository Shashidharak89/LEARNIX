import { NextResponse } from "next/server";
import { verifyAdminCaller } from "@/lib/adminAuth";
import { docClient, PROBLEMS_TABLE, TESTCASES_TABLE } from "@/lib/dynamodb";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const problemRes = await docClient.send(
      new GetCommand({
        TableName: PROBLEMS_TABLE,
        Key: { problemId: id },
      })
    );

    if (!problemRes.Item) {
      return NextResponse.json({ success: false, error: "Problem not found" }, { status: 404 });
    }

    const testCasesRes = await docClient.send(
      new QueryCommand({
        TableName: TESTCASES_TABLE,
        KeyConditionExpression: "problemId = :pid",
        ExpressionAttributeValues: { ":pid": id },
      })
    );

    const testCases = testCasesRes.Items || [];
    testCases.sort((a, b) => (a.order || 999) - (b.order || 999));

    return NextResponse.json({
      success: true,
      problem: problemRes.Item,
      testCases,
    });
  } catch (err) {
    console.error("Admin problem get error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch problem" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingRes = await docClient.send(
      new GetCommand({
        TableName: PROBLEMS_TABLE,
        Key: { problemId: id },
      })
    );

    if (!existingRes.Item) {
      return NextResponse.json({ success: false, error: "Problem not found" }, { status: 404 });
    }

    const existing = existingRes.Item;
    const now = new Date().toISOString();

    const mergedTemplates = {
      ...(existing.templates || {}),
      ...(body.templates || {}),
    };
    if (body.javaBoilerplate) mergedTemplates.java = body.javaBoilerplate;
    if (body.boilerplateCode) mergedTemplates.javascript = body.boilerplateCode;

    const updatedItem = {
      ...existing,
      ...body,
      problemId: id,
      templates: mergedTemplates,
      boilerplateCode: mergedTemplates.javascript || body.boilerplateCode || existing.boilerplateCode,
      javaBoilerplate: mergedTemplates.java || body.javaBoilerplate || existing.javaBoilerplate,
      updatedAt: now,
    };

    delete updatedItem.testCases; // ensure testcases not stored in problem table

    await docClient.send(
      new PutCommand({
        TableName: PROBLEMS_TABLE,
        Item: updatedItem,
      })
    );

    // If testCases were supplied, update them in testcases table
    if (Array.isArray(body.testCases)) {
      // First delete existing test cases
      const existingTc = await docClient.send(
        new QueryCommand({
          TableName: TESTCASES_TABLE,
          KeyConditionExpression: "problemId = :pid",
          ExpressionAttributeValues: { ":pid": id },
        })
      );

      for (const tc of existingTc.Items || []) {
        await docClient.send(
          new DeleteCommand({
            TableName: TESTCASES_TABLE,
            Key: { problemId: id, testCaseId: tc.testCaseId },
          })
        );
      }

      // Write new testcases
      for (let i = 0; i < body.testCases.length; i++) {
        const tc = body.testCases[i];
        const tcId = tc.testCaseId || `tc_${String(i + 1).padStart(2, "0")}`;

        let parsedInput = tc.input;
        if (typeof parsedInput === "string") {
          try {
            parsedInput = JSON.parse(parsedInput);
          } catch {
            // keep
          }
        }

        let parsedExpected = tc.expectedOutput;
        if (typeof parsedExpected === "string") {
          try {
            parsedExpected = JSON.parse(parsedExpected);
          } catch {
            // keep
          }
        }

        await docClient.send(
          new PutCommand({
            TableName: TESTCASES_TABLE,
            Item: {
              problemId: id,
              testCaseId: tcId,
              order: tc.order || i + 1,
              input: parsedInput,
              rawInput: tc.rawInput || (Array.isArray(parsedInput) ? parsedInput.join(", ") : String(parsedInput)),
              expectedOutput: parsedExpected,
              isSample: Boolean(tc.isSample),
              explanation: tc.explanation || "",
              createdAt: tc.createdAt || now,
            },
          })
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Problem updated successfully",
      problem: updatedItem,
    });
  } catch (err) {
    console.error("Admin problem update error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update problem" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const caller = await verifyAdminCaller(req);
    if (!caller) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete all testcases for this problem first
    const existingTc = await docClient.send(
      new QueryCommand({
        TableName: TESTCASES_TABLE,
        KeyConditionExpression: "problemId = :pid",
        ExpressionAttributeValues: { ":pid": id },
      })
    );

    for (const tc of existingTc.Items || []) {
      await docClient.send(
        new DeleteCommand({
          TableName: TESTCASES_TABLE,
          Key: { problemId: id, testCaseId: tc.testCaseId },
        })
      );
    }

    // Delete problem
    await docClient.send(
      new DeleteCommand({
        TableName: PROBLEMS_TABLE,
        Key: { problemId: id },
      })
    );

    return NextResponse.json({
      success: true,
      message: "Problem and its test cases deleted successfully",
    });
  } catch (err) {
    console.error("Admin problem delete error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete problem" },
      { status: 500 }
    );
  }
}

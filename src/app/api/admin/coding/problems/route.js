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

    // Support both single problem object AND array of problem objects
    const rawList = Array.isArray(body)
      ? body
      : Array.isArray(body?.problems)
      ? body.problems
      : [body];

    if (rawList.length === 0) {
      return NextResponse.json({ success: false, error: "No problems provided in request" }, { status: 400 });
    }

    // Determine current maximum problem order in PROBLEMS_TABLE
    const scanRes = await docClient.send(
      new ScanCommand({
        TableName: PROBLEMS_TABLE,
        ProjectionExpression: "problemId, #ord",
        ExpressionAttributeNames: { "#ord": "order" },
      })
    );
    let maxOrder = 0;
    const totalCount = scanRes.Items ? scanRes.Items.length : 0;
    for (const item of scanRes.Items || []) {
      const ord = Number(item.order);
      if (!isNaN(ord) && ord > maxOrder) {
        maxOrder = ord;
      }
    }
    // If total problem available is 11 then next will be 12 for sure
    let nextAvailableOrder = Math.max(maxOrder, totalCount);

    const createdProblems = [];
    const now = new Date().toISOString();

    // Comprehensive Java type mapping
    const javaTypeMap = {
      number: "int",
      int: "int",
      integer: "int",
      long: "long",
      double: "double",
      float: "double",
      string: "String",
      boolean: "boolean",
      bool: "boolean",
      char: "char",
      character: "char",
      "number[]": "int[]",
      "int[]": "int[]",
      "string[]": "String[]",
      "boolean[]": "boolean[]",
      array: "int[]",
      "array<number>": "int[]",
      "array<string>": "String[]",
      object: "Map<String, Object>",
      any: "Object",
      void: "void",
    };

    for (let i = 0; i < rawList.length; i++) {
      const probData = rawList[i];
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
        boilerplateCode,
        javaBoilerplate,
        order,
        isActive = true,
        testCases = [],
      } = probData;

      if (!title) {
        return NextResponse.json(
          { success: false, error: `Problem at index ${i} is missing required 'title'` },
          { status: 400 }
        );
      }

      const cleanSlug = (slug || title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const problemId = cleanSlug || `problem-${Date.now()}-${i}`;

      // Automatically assign sequential problem number
      nextAvailableOrder += 1;
      let assignedOrder;
      if (rawList.length > 1) {
        // Bulk import: strictly auto-assign sequentially
        assignedOrder = nextAvailableOrder;
      } else if (Number(order) > 0) {
        assignedOrder = Number(order);
      } else {
        assignedOrder = nextAvailableOrder;
      }

      const normRet = String(returnType || "int").toLowerCase();
      const jRetType = javaTypeMap[normRet] || "int";
      const jDefaultReturn =
        jRetType === "int" || jRetType === "long" || jRetType === "short" || jRetType === "byte"
          ? "return 0;"
          : jRetType === "double" || jRetType === "float"
          ? "return 0.0;"
          : jRetType === "boolean"
          ? "return false;"
          : jRetType === "String"
          ? 'return "";'
          : jRetType === "void"
          ? ""
          : jRetType.endsWith("[]")
          ? `return new ${jRetType}{};`
          : "return null;";

      const jParams = (parameters || [])
        .map((p) => {
          const pType = javaTypeMap[String(p.type || "number").toLowerCase()] || "int";
          return `${pType} ${p.name || "arg"}`;
        })
        .join(", ");

      const defaultJavaTemplate = `class Solution {\n    public ${jRetType} ${functionName}(${jParams}) {\n        // Write your code here\n        ${jDefaultReturn}\n    }\n}`;

      // Final templates for both JavaScript and Java
      const finalJsBoilerplate =
        templates.javascript ||
        boilerplateCode ||
        `/**\n${parameters.map((p) => ` * @param {${p.type || "any"}} ${p.name || "arg"}`).join("\n")}\n * @return {${returnType || "any"}}\n */\nfunction ${functionName}(${parameters.map((p) => p.name || "arg").join(", ")}) {\n    // Write your code here\n}`;

      const finalJavaBoilerplate =
        templates.java ||
        javaBoilerplate ||
        defaultJavaTemplate;

      const finalTemplates = {
        javascript: finalJsBoilerplate,
        java: finalJavaBoilerplate,
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
        boilerplateCode: finalJsBoilerplate,
        javaBoilerplate: finalJavaBoilerplate,
        order: assignedOrder,
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
        for (let j = 0; j < testCases.length; j++) {
          const tc = testCases[j];
          const tcId = tc.testCaseId || `tc_${String(j + 1).padStart(2, "0")}`;

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
                order: tc.order || j + 1,
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

      createdProblems.push(problemItem);
    }

    return NextResponse.json({
      success: true,
      count: createdProblems.length,
      message: `Successfully created ${createdProblems.length} problem(s)`,
      problems: createdProblems,
      problem: createdProblems[0], // for single problem backward-compatibility
    });
  } catch (err) {
    console.error("Admin problem creation error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create problem(s)" },
      { status: 500 }
    );
  }
}

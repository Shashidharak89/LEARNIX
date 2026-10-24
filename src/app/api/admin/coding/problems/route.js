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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const size = Math.max(1, parseInt(searchParams.get("size") || "20", 10));
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const difficulty = (searchParams.get("difficulty") || "all").trim();

    const scanRes = await docClient.send(
      new ScanCommand({
        TableName: PROBLEMS_TABLE,
      })
    );

    let allProblems = scanRes.Items || [];

    // Filter by difficulty if specified
    if (difficulty && difficulty !== "all") {
      allProblems = allProblems.filter(
        (p) => p.difficulty && p.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }

    // Filter by search keyword if specified
    if (search) {
      allProblems = allProblems.filter((p) => {
        const matchesTitle = p.title && p.title.toLowerCase().includes(search);
        const matchesSlug = p.slug && p.slug.toLowerCase().includes(search);
        const matchesId = p.problemId && p.problemId.toLowerCase().includes(search);
        const matchesOrder = String(p.order || "").includes(search);
        const matchesTags = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(search));
        const matchesTopics = Array.isArray(p.topicIds) && p.topicIds.some((tid) => tid.toLowerCase().includes(search));
        const matchesDesc = p.description && p.description.toLowerCase().includes(search);
        return matchesTitle || matchesSlug || matchesId || matchesOrder || matchesTags || matchesTopics || matchesDesc;
      });
    }

    // Sort by order ascending
    allProblems.sort((a, b) => (a.order || 999) - (b.order || 999));

    const total = allProblems.length;
    const totalPages = Math.ceil(total / size);
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const sliced = allProblems.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    // For the requested slice only, get testcase count
    const enriched = await Promise.all(
      sliced.map(async (p) => {
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

    return NextResponse.json({
      success: true,
      problems: enriched,
      page,
      size,
      total,
      totalPages,
      hasMore,
    });
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
        topicIds = [],
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

      // Normalize topicIds
      let normalizedTopicIds = Array.isArray(topicIds)
        ? topicIds
        : Array.isArray(probData.topics)
        ? probData.topics
        : typeof topicIds === "string"
        ? topicIds.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];

      let normalizedTags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      // If topicIds provided but tags empty, format topicIds into display tags
      if (normalizedTags.length === 0 && normalizedTopicIds.length > 0) {
        normalizedTags = normalizedTopicIds.map(
          (tid) => tid.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        );
      }

      // If tags provided but topicIds empty, infer topicIds from tags
      if (normalizedTopicIds.length === 0 && normalizedTags.length > 0) {
        normalizedTopicIds = normalizedTags.map((t) =>
          t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
        );
      }

      const problemItem = {
        problemId,
        slug: cleanSlug,
        title,
        difficulty,
        tags: normalizedTags,
        topicIds: normalizedTopicIds,
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

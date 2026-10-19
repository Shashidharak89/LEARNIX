import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";
const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const PROBLEMS_TABLE = "LearnixCodingProblems";
const TESTCASES_TABLE = "LearnixCodingTestCases";

async function ensureTable(tableName, keySchema, attributeDefinitions) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`✓ Table ${tableName} already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`Creating table ${tableName}...`);
      await client.send(
        new CreateTableCommand({
          TableName: tableName,
          KeySchema: keySchema,
          AttributeDefinitions: attributeDefinitions,
          BillingMode: "PAY_PER_REQUEST",
        })
      );
      console.log(`Waiting for table ${tableName} to become ACTIVE...`);
      await waitUntilTableExists(
        { client, maxWaitTime: 60 },
        { TableName: tableName }
      );
      console.log(`✓ Table ${tableName} created and active.`);
    } else {
      throw err;
    }
  }
}

async function seedData() {
  const problemId = "add-two-numbers";

  const problem = {
    problemId,
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    difficulty: "Easy",
    tags: ["Math", "Basics", "Algorithms"],
    description: `### Problem Description

Given two integers \`a\` and \`b\`, return their sum.

You must implement a function \`addTwoNumbers(a, b)\` that takes two numbers as arguments and returns the resulting sum.

#### Examples

**Example 1:**
\`\`\`text
Input: a = 2, b = 3
Output: 5
Explanation: 2 + 3 = 5.
\`\`\`

**Example 2:**
\`\`\`text
Input: a = -5, b = 10
Output: 5
Explanation: -5 + 10 = 5.
\`\`\`

**Example 3:**
\`\`\`text
Input: a = 0, b = 0
Output: 0
\`\`\`
`,
    inputFormat: "Two integers `a` and `b` passed into the function.",
    outputFormat: "Return a single integer representing the sum of `a` and `b`.",
    constraints: [
      "-10^9 <= a <= 10^9",
      "-10^9 <= b <= 10^9",
      "Function must return a number"
    ],
    functionName: "addTwoNumbers",
    parameters: [
      { name: "a", type: "number" },
      { name: "b", type: "number" }
    ],
    returnType: "number",
    templates: {
      javascript: `/**
 * Adds two numbers together.
 * 
 * @param {number} a - The first number
 * @param {number} b - The second number
 * @return {number} - The sum of a and b
 */
function addTwoNumbers(a, b) {
    // Write your code here
    return a + b;
}`
    },
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testCases = [
    {
      problemId,
      testCaseId: "tc_01",
      order: 1,
      input: [2, 3],
      rawInput: "a = 2, b = 3",
      expectedOutput: 5,
      isSample: true,
      explanation: "2 + 3 equals 5",
      createdAt: new Date().toISOString(),
    },
    {
      problemId,
      testCaseId: "tc_02",
      order: 2,
      input: [-5, 10],
      rawInput: "a = -5, b = 10",
      expectedOutput: 5,
      isSample: true,
      explanation: "-5 + 10 equals 5",
      createdAt: new Date().toISOString(),
    },
    {
      problemId,
      testCaseId: "tc_03",
      order: 3,
      input: [0, 0],
      rawInput: "a = 0, b = 0",
      expectedOutput: 0,
      isSample: true,
      explanation: "0 + 0 equals 0",
      createdAt: new Date().toISOString(),
    },
    {
      problemId,
      testCaseId: "tc_04",
      order: 4,
      input: [100, 250],
      rawInput: "a = 100, b = 250",
      expectedOutput: 350,
      isSample: false,
      createdAt: new Date().toISOString(),
    },
    {
      problemId,
      testCaseId: "tc_05",
      order: 5,
      input: [-50, -30],
      rawInput: "a = -50, b = -30",
      expectedOutput: -80,
      isSample: false,
      createdAt: new Date().toISOString(),
    },
    {
      problemId,
      testCaseId: "tc_06",
      order: 6,
      input: [1000000, 2000000],
      rawInput: "a = 1000000, b = 2000000",
      expectedOutput: 3000000,
      isSample: false,
      createdAt: new Date().toISOString(),
    },
    {
      problemId,
      testCaseId: "tc_07",
      order: 7,
      input: [-999999, 999999],
      rawInput: "a = -999999, b = 999999",
      expectedOutput: 0,
      isSample: false,
      createdAt: new Date().toISOString(),
    },
    {
      problemId,
      testCaseId: "tc_08",
      order: 8,
      input: [42, -42],
      rawInput: "a = 42, b = -42",
      expectedOutput: 0,
      isSample: false,
      createdAt: new Date().toISOString(),
    },
    {
      problemId,
      testCaseId: "tc_09",
      order: 9,
      input: [123456789, 987654321],
      rawInput: "a = 123456789, b = 987654321",
      expectedOutput: 1111111110,
      isSample: false,
      createdAt: new Date().toISOString(),
    },
    {
      problemId,
      testCaseId: "tc_10",
      order: 10,
      input: [0, -999],
      rawInput: "a = 0, b = -999",
      expectedOutput: -999,
      isSample: false,
      createdAt: new Date().toISOString(),
    },
  ];

  console.log(`Writing problem "${problem.title}" to ${PROBLEMS_TABLE}...`);
  await docClient.send(
    new PutCommand({
      TableName: PROBLEMS_TABLE,
      Item: problem,
    })
  );

  console.log(`Writing 10 test cases to ${TESTCASES_TABLE}...`);
  for (const tc of testCases) {
    await docClient.send(
      new PutCommand({
        TableName: TESTCASES_TABLE,
        Item: tc,
      })
    );
  }

  console.log("✓ Seeding complete!");
}

async function main() {
  console.log("Setting up DynamoDB tables...");

  // 1. CodingProblems table: PK = problemId
  await ensureTable(
    PROBLEMS_TABLE,
    [{ AttributeName: "problemId", KeyType: "HASH" }],
    [{ AttributeName: "problemId", AttributeType: "S" }]
  );

  // 2. CodingTestCases table: PK = problemId, SK = testCaseId
  await ensureTable(
    TESTCASES_TABLE,
    [
      { AttributeName: "problemId", KeyType: "HASH" },
      { AttributeName: "testCaseId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "problemId", AttributeType: "S" },
      { AttributeName: "testCaseId", AttributeType: "S" },
    ]
  );

  await seedData();
}

main().catch((err) => {
  console.error("Setup error:", err);
  process.exit(1);
});

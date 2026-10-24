import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";
const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TOPICS_TABLE = process.env.DYNAMODB_TOPICS_TABLE || "LearnixCodingTopics";
const PROBLEMS_TABLE = process.env.DYNAMODB_PROBLEMS_TABLE || "LearnixCodingProblems";

export const SEED_TOPICS = [
  {
    topicId: "arrays",
    name: "Arrays",
    description: "Contiguous memory sequence, indexing, traversal, and in-place transformations.",
    order: 1,
    isActive: true,
  },
  {
    topicId: "hash-table",
    name: "Hash Table",
    description: "Key-value mappings, frequency counts, lookups in O(1) average time.",
    order: 2,
    isActive: true,
  },
  {
    topicId: "strings",
    name: "Strings",
    description: "Character sequences, substrings, anagrams, palindromes, and parsing.",
    order: 3,
    isActive: true,
  },
  {
    topicId: "math",
    name: "Math",
    description: "Number theory, prime numbers, arithmetic progressions, and modular math.",
    order: 4,
    isActive: true,
  },
  {
    topicId: "two-pointers",
    name: "Two Pointers",
    description: "Opposite ends, fast/slow runners, and sliding intervals.",
    order: 5,
    isActive: true,
  },
  {
    topicId: "dynamic-programming",
    name: "Dynamic Programming",
    description: "Optimal substructure, memoization, tabulation, and recurrence relations.",
    order: 6,
    isActive: true,
  },
  {
    topicId: "binary-search",
    name: "Binary Search",
    description: "Logarithmic search on sorted arrays and monotonic search spaces.",
    order: 7,
    isActive: true,
  },
  {
    topicId: "sorting",
    name: "Sorting",
    description: "QuickSort, MergeSort, custom comparators, and ordering techniques.",
    order: 8,
    isActive: true,
  },
  {
    topicId: "recursion",
    name: "Recursion",
    description: "Divide-and-conquer, recursive base cases, and call stack trees.",
    order: 9,
    isActive: true,
  },
  {
    topicId: "stack",
    name: "Stack",
    description: "Last-In-First-Out, monotonic stacks, bracket validation, and expression evaluation.",
    order: 10,
    isActive: true,
  },
  {
    topicId: "queue",
    name: "Queue",
    description: "First-In-First-Out, circular queues, deques, and BFS exploration.",
    order: 11,
    isActive: true,
  },
  {
    topicId: "linked-list",
    name: "Linked List",
    description: "Singly and doubly linked nodes, pointer manipulation, and cycle detection.",
    order: 12,
    isActive: true,
  },
  {
    topicId: "trees",
    name: "Trees",
    description: "Hierarchical nodes, Binary Search Trees (BST), and tree traversals.",
    order: 13,
    isActive: true,
  },
  {
    topicId: "binary-tree",
    name: "Binary Tree",
    description: "In-order, pre-order, post-order, BFS level-order, and path sum problems.",
    order: 14,
    isActive: true,
  },
  {
    topicId: "graphs",
    name: "Graphs",
    description: "Vertices, edges, DFS, BFS, topological sort, and shortest path algorithms.",
    order: 15,
    isActive: true,
  },
  {
    topicId: "sliding-window",
    name: "Sliding Window",
    description: "Fixed and dynamic length window optimizations on arrays and strings.",
    order: 16,
    isActive: true,
  },
  {
    topicId: "greedy",
    name: "Greedy",
    description: "Locally optimal choices aiming for global optimum solutions.",
    order: 17,
    isActive: true,
  },
  {
    topicId: "heap",
    name: "Heap",
    description: "Min-heap, max-heap, priority queues, and top-K elements.",
    order: 18,
    isActive: true,
  },
  {
    topicId: "backtracking",
    name: "Backtracking",
    description: "Exhaustive state-space search, permutations, subsets, and puzzle solving.",
    order: 19,
    isActive: true,
  },
  {
    topicId: "bit-manipulation",
    name: "Bit Manipulation",
    description: "Bitwise AND, OR, XOR, shifts, masking, and binary representation.",
    order: 20,
    isActive: true,
  },
  {
    topicId: "matrix",
    name: "Matrix",
    description: "2D grids, spiral traversal, row/column operations, and grid pathfinding.",
    order: 21,
    isActive: true,
  },
  {
    topicId: "basics",
    name: "Basics",
    description: "Fundamental logic, conditionals, simple loops, and elementary syntax.",
    order: 22,
    isActive: true,
  },
];

// Mapping problem slug or id to topicIds
const EXISTING_PROBLEM_TOPIC_MAP = {
  "add-two-numbers": {
    topicIds: ["math", "basics"],
    tags: ["Math", "Basics"],
  },
  "longest-consecutive-sequence": {
    topicIds: ["arrays", "hash-table"],
    tags: ["Arrays", "Hash Table"],
  },
  "reverse-string": {
    topicIds: ["strings", "two-pointers"],
    tags: ["Strings", "Two Pointers"],
  },
  "palindrome-number": {
    topicIds: ["math"],
    tags: ["Math"],
  },
  "fizz-buzz": {
    topicIds: ["math"],
    tags: ["Math"],
  },
  "find-maximum": {
    topicIds: ["arrays", "basics"],
    tags: ["Arrays", "Basics"],
  },
  "valid-parentheses": {
    topicIds: ["strings", "stack"],
    tags: ["Strings", "Stack"],
  },
  "factorial": {
    topicIds: ["math", "recursion"],
    tags: ["Math", "Recursion"],
  },
  "count-vowels": {
    topicIds: ["strings"],
    tags: ["Strings"],
  },
  "fibonacci-number": {
    topicIds: ["math", "dynamic-programming"],
    tags: ["Math", "Dynamic Programming"],
  },
};

async function setupTopics() {
  console.log(`Checking table: ${TOPICS_TABLE}...`);

  try {
    await client.send(new DescribeTableCommand({ TableName: TOPICS_TABLE }));
    console.log(`✓ Table ${TOPICS_TABLE} already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`Creating table ${TOPICS_TABLE}...`);
      await client.send(
        new CreateTableCommand({
          TableName: TOPICS_TABLE,
          KeySchema: [{ AttributeName: "topicId", KeyType: "HASH" }],
          AttributeDefinitions: [{ AttributeName: "topicId", AttributeType: "S" }],
          BillingMode: "PAY_PER_REQUEST",
        })
      );

      console.log(`Waiting for ${TOPICS_TABLE} to become ACTIVE...`);
      await waitUntilTableExists(
        { client, maxWaitTime: 60 },
        { TableName: TOPICS_TABLE }
      );
      console.log(`✓ Table ${TOPICS_TABLE} is now ACTIVE.`);
    } else {
      console.error("Error checking/creating table:", err);
      process.exit(1);
    }
  }

  // Seed topics
  console.log("Seeding all topics into DynamoDB...");
  const now = new Date().toISOString();
  for (const t of SEED_TOPICS) {
    await docClient.send(
      new PutCommand({
        TableName: TOPICS_TABLE,
        Item: {
          ...t,
          createdAt: now,
          updatedAt: now,
        },
      })
    );
    console.log(`✓ Seeded topic: ${t.name} (id: "${t.topicId}")`);
  }

  // Update existing problems in PROBLEMS_TABLE
  console.log("\nUpdating existing problems with topicIds reference in DynamoDB...");
  const scanRes = await docClient.send(
    new ScanCommand({
      TableName: PROBLEMS_TABLE,
    })
  );

  const existingProblems = scanRes.Items || [];
  for (const prob of existingProblems) {
    const mapping = EXISTING_PROBLEM_TOPIC_MAP[prob.problemId] || EXISTING_PROBLEM_TOPIC_MAP[prob.slug];
    if (mapping) {
      await docClient.send(
        new UpdateCommand({
          TableName: PROBLEMS_TABLE,
          Key: { problemId: prob.problemId },
          UpdateExpression: "SET topicIds = :tids, tags = :tags, updatedAt = :now",
          ExpressionAttributeValues: {
            ":tids": mapping.topicIds,
            ":tags": mapping.tags,
            ":now": now,
          },
        })
      );
      console.log(`✓ Updated "${prob.title}" (${prob.problemId}) with topicIds: [${mapping.topicIds.join(", ")}]`);
    } else {
      // Default fallback if problem not explicitly in mapping
      const inferredTopicIds = (prob.tags || []).map((t) =>
        t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
      );
      await docClient.send(
        new UpdateCommand({
          TableName: PROBLEMS_TABLE,
          Key: { problemId: prob.problemId },
          UpdateExpression: "SET topicIds = :tids, updatedAt = :now",
          ExpressionAttributeValues: {
            ":tids": inferredTopicIds,
            ":now": now,
          },
        })
      );
      console.log(`✓ Inferred topicIds for "${prob.title}": [${inferredTopicIds.join(", ")}]`);
    }
  }

  console.log("\n✓ All topics seeded and existing problems updated with topic references successfully!");
}

setupTopics().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});

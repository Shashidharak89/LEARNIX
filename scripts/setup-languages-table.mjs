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
const LANGUAGES_TABLE = process.env.DYNAMODB_LANGUAGES_TABLE || "LearnixCodingLanguages";

const SEED_LANGUAGES = [
  {
    languageId: "javascript",
    name: "JavaScript",
    version: "ES2024 / Node.js",
    monaco: "javascript",
    extension: "js",
    executionMode: "browser", // Can run client-side worker or server sandbox
    order: 1,
    isActive: true,
    defaultCode: `/**\n * Solution\n */\nfunction solution() {\n    // Write your code here\n}`,
    createdAt: new Date().toISOString(),
  },
  {
    languageId: "java",
    name: "Java",
    version: "OpenJDK 25",
    monaco: "java",
    extension: "java",
    executionMode: "server", // Runs on server using compile-run
    order: 2,
    isActive: true,
    defaultCode: `class Solution {\n    public int solution() {\n        // Write your code here\n        return 0;\n    }\n}`,
    createdAt: new Date().toISOString(),
  },
];

async function setupLanguagesTable() {
  console.log(`Checking table: ${LANGUAGES_TABLE}...`);

  try {
    await client.send(new DescribeTableCommand({ TableName: LANGUAGES_TABLE }));
    console.log(`✓ Table ${LANGUAGES_TABLE} already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`Creating table ${LANGUAGES_TABLE}...`);
      await client.send(
        new CreateTableCommand({
          TableName: LANGUAGES_TABLE,
          KeySchema: [{ AttributeName: "languageId", KeyType: "HASH" }],
          AttributeDefinitions: [{ AttributeName: "languageId", AttributeType: "S" }],
          BillingMode: "PAY_PER_REQUEST",
        })
      );

      console.log(`Waiting for ${LANGUAGES_TABLE} to become ACTIVE...`);
      await waitUntilTableExists(
        { client, maxWaitTime: 60 },
        { TableName: LANGUAGES_TABLE }
      );
      console.log(`✓ Table ${LANGUAGES_TABLE} is now ACTIVE.`);
    } else {
      console.error("Error creating table:", err);
      process.exit(1);
    }
  }

  // Seed languages
  console.log("Seeding languages into DynamoDB...");
  for (const lang of SEED_LANGUAGES) {
    await docClient.send(
      new PutCommand({
        TableName: LANGUAGES_TABLE,
        Item: lang,
      })
    );
    console.log(`✓ Seeded language: ${lang.name} (${lang.languageId})`);
  }

  console.log("Languages setup completed successfully.");
}

setupLanguagesTable();

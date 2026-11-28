import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const tableName = process.env.DYNAMODB_PAGE_VISITS_TABLE || "LearnixPageVisits";
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function setupPageVisitsTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`DynamoDB table ${tableName} already exists.`);
    return;
  } catch (error) {
    if (error?.name !== "ResourceNotFoundException") throw error;
  }

  await client.send(new CreateTableCommand({
    TableName: tableName,
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  }));
  await waitUntilTableExists({ client, maxWaitTime: 60 }, { TableName: tableName });
  console.log(`DynamoDB table ${tableName} is ready.`);
}

setupPageVisitsTable().catch((error) => {
  console.error("Could not set up the Page Visits table:", error);
  process.exit(1);
});

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});
const tableName = process.env.DYNAMODB_KEEP_TABLE || "LearnixKeep";

async function setup() {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`DynamoDB table ${tableName} already exists.`);
  } catch (error) {
    if (error.name !== "ResourceNotFoundException") throw error;
    await client.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "itemId", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "itemId", AttributeType: "S" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }));
    await waitUntilTableExists({ client, maxWaitTime: 60 }, { TableName: tableName });
    console.log(`DynamoDB table ${tableName} is ready.`);
  }
}

setup().catch((error) => {
  console.error("Could not set up the Keep table:", error);
  process.exit(1);
});

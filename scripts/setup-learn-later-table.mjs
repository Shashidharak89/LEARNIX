import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";
const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const TABLE_NAME = process.env.DYNAMODB_LEARN_LATER_TABLE || "LearnixLearnLater";

async function setup() {
  try {
    console.log(`Checking table ${TABLE_NAME}...`);
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`✓ Table ${TABLE_NAME} already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`Creating table ${TABLE_NAME}...`);
      await client.send(
        new CreateTableCommand({
          TableName: TABLE_NAME,
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "itemId", KeyType: "RANGE" },
          ],
          AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "itemId", AttributeType: "S" },
          ],
          BillingMode: "PAY_PER_REQUEST",
        })
      );
      console.log(`Waiting for table ${TABLE_NAME} to become ACTIVE...`);
      await waitUntilTableExists(
        { client, maxWaitTime: 60 },
        { TableName: TABLE_NAME }
      );
      console.log(`✓ Table ${TABLE_NAME} created successfully and active.`);
    } else {
      console.error("Error checking/creating table:", err);
      process.exit(1);
    }
  }
}

setup();

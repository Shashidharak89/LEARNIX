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

const SEARCHES_TABLE = process.env.DYNAMODB_SEARCHES_TABLE || "LearnixSearches";

async function setup() {
  try {
    await client.send(new DescribeTableCommand({ TableName: SEARCHES_TABLE }));
    console.log(`✓ Table ${SEARCHES_TABLE} already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`Creating table ${SEARCHES_TABLE}...`);
      await client.send(
        new CreateTableCommand({
          TableName: SEARCHES_TABLE,
          KeySchema: [
            { AttributeName: "id", KeyType: "HASH" },
          ],
          AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "entityType", AttributeType: "S" },
            { AttributeName: "createdAt", AttributeType: "S" },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "entityType-createdAt-index",
              KeySchema: [
                { AttributeName: "entityType", KeyType: "HASH" },
                { AttributeName: "createdAt", KeyType: "RANGE" },
              ],
              Projection: { ProjectionType: "ALL" },
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        })
      );
      console.log(`Waiting for table ${SEARCHES_TABLE} to become ACTIVE...`);
      await waitUntilTableExists(
        { client, maxWaitTime: 60 },
        { TableName: SEARCHES_TABLE }
      );
      console.log(`✓ Table ${SEARCHES_TABLE} created successfully and active.`);
    } else {
      console.error("Error creating table:", err);
      process.exit(1);
    }
  }
}

setup();

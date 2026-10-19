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

const SUBMISSIONS_TABLE = "LearnixCodingSubmissions";

async function setup() {
  try {
    await client.send(new DescribeTableCommand({ TableName: SUBMISSIONS_TABLE }));
    console.log(`✓ Table ${SUBMISSIONS_TABLE} already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`Creating table ${SUBMISSIONS_TABLE}...`);
      await client.send(
        new CreateTableCommand({
          TableName: SUBMISSIONS_TABLE,
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "submissionId", KeyType: "RANGE" },
          ],
          AttributeDefinitions: [
            { AttributeName: "userId", AttributeType: "S" },
            { AttributeName: "submissionId", AttributeType: "S" },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "submissionId-index",
              KeySchema: [{ AttributeName: "submissionId", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        })
      );
      console.log(`Waiting for table ${SUBMISSIONS_TABLE} to become ACTIVE...`);
      await waitUntilTableExists(
        { client, maxWaitTime: 60 },
        { TableName: SUBMISSIONS_TABLE }
      );
      console.log(`✓ Table ${SUBMISSIONS_TABLE} created successfully and active.`);
    } else {
      console.error("Error creating table:", err);
      process.exit(1);
    }
  }
}

setup();

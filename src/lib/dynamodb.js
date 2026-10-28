import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const rawDynamoClient = client;

export const PROBLEMS_TABLE = process.env.DYNAMODB_PROBLEMS_TABLE || "LearnixCodingProblems";
export const TESTCASES_TABLE = process.env.DYNAMODB_TESTCASES_TABLE || "LearnixCodingTestCases";
export const SUBMISSIONS_TABLE = process.env.DYNAMODB_SUBMISSIONS_TABLE || "LearnixCodingSubmissions";
export const LANGUAGES_TABLE = process.env.DYNAMODB_LANGUAGES_TABLE || "LearnixCodingLanguages";
export const TOPICS_TABLE = process.env.DYNAMODB_TOPICS_TABLE || "LearnixCodingTopics";
export const LEARN_LATER_TABLE = process.env.DYNAMODB_LEARN_LATER_TABLE || "LearnixLearnLater";


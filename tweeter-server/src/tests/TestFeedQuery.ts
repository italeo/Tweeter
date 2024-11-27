import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-west-2" });

const testFeedQuery = async (alias: string) => {
  const params = {
    TableName: "Feed",
    KeyConditionExpression: "alias = :alias",
    ExpressionAttributeValues: {
      ":alias": { S: alias },
    },
  };

  try {
    const data = await client.send(new QueryCommand(params));
    console.log(`Feed items for alias ${alias}:`, data.Items);
    return data.Items;
  } catch (error) {
    console.error(`Error querying feed for alias ${alias}:`, error);
    throw error;
  }
};

// Test for a specific alias
testFeedQuery("isabel");

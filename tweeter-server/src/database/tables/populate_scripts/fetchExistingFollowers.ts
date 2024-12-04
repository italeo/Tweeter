import {
  DynamoDBClient,
  ScanCommand,
  ScanCommandOutput,
} from "@aws-sdk/client-dynamodb";

// Initialize the DynamoDB client
const client = new DynamoDBClient({ region: "us-west-2" });

export async function fetchExistingFollowers(): Promise<Set<string>> {
  console.log("Fetching existing followers...");
  const existingFollowers = new Set<string>();

  const params = {
    TableName: "Followers",
    FilterExpression: "followeeAlias = :followeeAlias",
    ExpressionAttributeValues: {
      ":followeeAlias": { S: "@ish" },
    },
  };

  let lastEvaluatedKey: ScanCommandOutput["LastEvaluatedKey"] = undefined;

  do {
    try {
      const result: ScanCommandOutput = await client.send(
        new ScanCommand({ ...params, ExclusiveStartKey: lastEvaluatedKey })
      );

      if (result.Items) {
        result.Items.forEach((item) => {
          if (item.followerAlias?.S) {
            existingFollowers.add(item.followerAlias.S);
          }
        });
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } catch (error) {
      console.error("Error fetching followers:", error);
      throw error; // Re-throw after logging
    }
  } while (lastEvaluatedKey);

  console.log(`Total existing followers found: ${existingFollowers.size}`);
  return existingFollowers;
}

// Run the script
(async () => {
  try {
    const followers = await fetchExistingFollowers();
    console.log("Fetched followers:", Array.from(followers));
  } catch (error) {
    console.error("Script encountered an error:", error);
  }
})();

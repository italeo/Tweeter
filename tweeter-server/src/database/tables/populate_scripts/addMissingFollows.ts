import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { fetchExistingFollowers } from "./fetchExistingFollowers";

const client = new DynamoDBClient({ region: "us-west-2" });

async function addMissingFollowers() {
  console.log("Starting to find and add missing followers...");

  // Fetch existing followers from DynamoDB
  const existingFollowers = await fetchExistingFollowers();

  // Generate the complete range of expected follower aliases
  const totalFollowers = 10000;
  const expectedFollowers = new Set<string>();
  for (let i = 1; i <= totalFollowers; i++) {
    expectedFollowers.add(`@donald${i}`);
  }

  // Find the difference between expected and existing followers
  const missingFollowers = Array.from(expectedFollowers).filter(
    (alias) => !existingFollowers.has(alias)
  );

  console.log(`Missing followers count: ${missingFollowers.length}`);

  // Insert missing followers into DynamoDB
  for (const missingFollower of missingFollowers) {
    const params: PutItemCommandInput = {
      TableName: "Followers",
      Item: {
        followeeAlias: { S: "@ish" },
        followerAlias: { S: missingFollower },
      },
    };

    try {
      await client.send(new PutItemCommand(params));
      console.log(`Added missing follower: ${missingFollower}`);
    } catch (error) {
      console.error(`Error adding follower ${missingFollower}:`, error);
    }
  }

  console.log("All missing followers added successfully.");
}

// Run the script
addMissingFollowers().catch((err) => {
  console.error("Error running the script:", err);
});

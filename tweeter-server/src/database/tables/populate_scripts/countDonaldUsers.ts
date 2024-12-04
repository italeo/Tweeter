import {
  DynamoDBClient,
  ScanCommand,
  ScanCommandOutput,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-west-2" });

async function countDonaldUsers(): Promise<number> {
  console.log("Counting @donald users in the Users table...");

  const params = {
    TableName: "Users",
    FilterExpression: "begins_with(#alias, :aliasPrefix)",
    ExpressionAttributeNames: {
      "#alias": "alias", // Correct attribute name based on your table
    },
    ExpressionAttributeValues: {
      ":aliasPrefix": { S: "@donald" },
    },
  };

  let totalCount = 0;
  let lastEvaluatedKey: ScanCommandOutput["LastEvaluatedKey"] = undefined;

  do {
    // Fetch a batch of results
    const result: ScanCommandOutput = await client.send(
      new ScanCommand({ ...params, ExclusiveStartKey: lastEvaluatedKey })
    );

    // Count the items in the current batch
    const batchCount = result.Items?.length ?? 0;
    totalCount += batchCount;

    console.log(
      `Batch count: ${batchCount}, Total count so far: ${totalCount}`
    );

    // Update the `lastEvaluatedKey` to fetch the next batch
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Total @donald users found: ${totalCount}`);
  return totalCount;
}

// Run the script
countDonaldUsers()
  .then((totalCount) => {
    if (totalCount === 10000) {
      console.log("Success: Exactly 10,000 @donald users found.");
    } else {
      console.log(
        `Warning: Expected 10,000 @donald users, but found ${totalCount}.`
      );
    }
  })
  .catch((err) => {
    console.error("Error running the script:", err);
  });

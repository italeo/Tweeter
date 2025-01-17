import {
  DynamoDBClient,
  BatchWriteItemCommand,
  WriteRequest,
} from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({ region: "us-west-2" });

const FEED_TABLE_NAME = "Feed";

// Utility function to split an array into smaller DynamoDB batches
function splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

export const handler = async (event: any) => {
  console.log("Received SQS Event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      // Parse the SQS message
      const messageBody = JSON.parse(record.body);
      const { followers, status }: { followers: string[]; status: any } =
        messageBody;

      if (!followers || !status) {
        console.error("Invalid message format. Skipping:", messageBody);
        continue;
      }

      console.log(
        `Processing feed updates for ${followers.length} followers for status: ${status.authorAlias}`
      );

      // Prepare batch write requests for DynamoDB
      const writeRequests: WriteRequest[] = followers.map(
        (followerAlias: string) => ({
          PutRequest: {
            Item: {
              alias: { S: followerAlias }, // Follower's alias
              timestamp: { N: status.timestamp.toString() },
              authorAlias: { S: status.authorAlias }, // Status author's alias
              post: { S: status.post }, // Status content
            },
          },
        })
      );

      // Split into smaller DynamoDB batches (25 items max per batch)
      const dynamoBatches = splitIntoBatches(writeRequests, 25);

      for (const batch of dynamoBatches) {
        let retries = 0;
        const maxRetries = 5; // Maximum number of retries
        const delay = (retryCount: number) =>
          new Promise((res) => setTimeout(res, Math.pow(2, retryCount) * 100));

        while (retries < maxRetries) {
          try {
            const params = {
              RequestItems: {
                [FEED_TABLE_NAME]: batch,
              },
            };

            const result = await dynamoDBClient.send(
              new BatchWriteItemCommand(params)
            );

            console.log("Batch write result:", result);

            // Handle unprocessed items
            if (
              result.UnprocessedItems &&
              result.UnprocessedItems[FEED_TABLE_NAME]
            ) {
              console.warn(
                "Some items were not processed. Retrying unprocessed items..."
              );
              batch.splice(
                0,
                batch.length,
                ...result.UnprocessedItems[FEED_TABLE_NAME]
              );
              retries++;
              await delay(retries); // Apply exponential backoff
            } else {
              break; // Exit retry loop if all items are processed
            }
          } catch (error) {
            console.error(
              `Error writing batch to DynamoDB. Attempt ${retries + 1}:`,
              error
            );
            retries++;
            await delay(retries);
          }
        }

        if (retries === maxRetries) {
          console.error(
            "Max retries reached. Unprocessed items:",
            JSON.stringify(batch, null, 2)
          );
          // Optionally send failed batches to a Dead Letter Queue (DLQ)
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  console.log("Feed update Lambda completed.");
};

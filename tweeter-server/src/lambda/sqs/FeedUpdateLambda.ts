import {
  DynamoDBClient,
  BatchWriteItemCommand,
  WriteRequest,
} from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({ region: "us-west-2" });

const FEED_TABLE_NAME = "Feed";

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
        `Updating feeds for ${followers.length} followers for status: ${status.authorAlias}`
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

      // Split into batches of 25
      const batches = splitIntoBatches(writeRequests, 25);

      for (const batch of batches) {
        const params = {
          RequestItems: {
            [FEED_TABLE_NAME]: batch,
          },
        };

        try {
          const result = await dynamoDBClient.send(
            new BatchWriteItemCommand(params)
          );
          console.log("Batch write result:", result);

          if (
            result.UnprocessedItems &&
            result.UnprocessedItems[FEED_TABLE_NAME]
          ) {
            console.error(
              "Some items were not processed. Retrying unprocessed items..."
            );
            // Retry logic for unprocessed items
            const retryParams = {
              RequestItems: result.UnprocessedItems,
            };
            await dynamoDBClient.send(new BatchWriteItemCommand(retryParams));
          }
        } catch (error) {
          console.error("Error writing batch to DynamoDB:", error);
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      // Optionally handle failed messages (e.g., send to Dead Letter Queue)
    }
  }

  console.log("Feed update Lambda completed.");
};

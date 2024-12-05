import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { DynamoDBClient, BatchGetItemCommand } from "@aws-sdk/client-dynamodb";
import { UserDto } from "tweeter-shared";

const sqsClient = new SQSClient({ region: "us-west-2" });
const batchProcessingQueueUrl =
  "https://sqs.us-west-2.amazonaws.com/506149017946/BatchProcessingQueue";
const BATCH_SIZE = 25;

export async function batchFetchUserDetails(
  client: DynamoDBClient,
  aliases: string[],
  useQueue: boolean = true
): Promise<Map<string, UserDto>> {
  const userMap = new Map<string, UserDto>();
  const tableName = "Users";

  // Validation for empty aliases
  if (aliases.length === 0) {
    console.warn("No aliases provided. Returning an empty user map.");
    return userMap;
  }

  if (useQueue) {
    // If using SQS, send aliases to the queue
    const batches: string[][] = [];
    for (let i = 0; i < aliases.length; i += BATCH_SIZE) {
      batches.push(aliases.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const messageBody = {
        operation: "fetchUserDetails",
        aliases: batch,
      };

      const params = {
        QueueUrl: batchProcessingQueueUrl,
        MessageBody: JSON.stringify(messageBody),
      };

      try {
        await sqsClient.send(new SendMessageCommand(params));
        console.log(
          `Batch of ${batch.length} aliases sent to BatchProcessingQueue: ${batch}`
        );
      } catch (error) {
        console.error(
          `Error sending batch to BatchProcessingQueue: ${batch}`,
          error
        );
        throw error;
      }
    }

    console.log(
      `Dispatched ${batches.length} batches to BatchProcessingQueue.`
    );
    return userMap; // Return empty map since processing happens asynchronously
  } else {
    // Process directly using DynamoDB BatchGetItem
    const batchedAliases: string[][] = [];
    for (let i = 0; i < aliases.length; i += BATCH_SIZE) {
      batchedAliases.push(aliases.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batchedAliases) {
      const params = {
        RequestItems: {
          [tableName]: {
            Keys: batch.map((alias) => ({ alias: { S: alias } })),
          },
        },
      };

      try {
        const result = await client.send(new BatchGetItemCommand(params));

        if (result.Responses?.[tableName]) {
          result.Responses[tableName].forEach((item) => {
            const alias = item.alias?.S || "";
            if (alias) {
              userMap.set(alias, {
                alias,
                firstName: item.firstName?.S || "Unknown",
                lastName: item.lastName?.S || "Unknown",
                imageUrl: item.imageUrl?.S || "",
              });
            }
          });
        }

        // Handle unprocessed keys (if any)
        const unprocessedKeys =
          result.UnprocessedKeys?.[tableName]?.Keys?.map(
            (key) => key.alias?.S
          ).filter((alias): alias is string => !!alias) || [];

        if (unprocessedKeys.length > 0) {
          console.warn(
            `Unprocessed keys encountered in batch: ${unprocessedKeys}`
          );
        }
      } catch (error) {
        console.error("Error fetching user details directly:", error);
        throw error;
      }
    }

    return userMap;
  }
}

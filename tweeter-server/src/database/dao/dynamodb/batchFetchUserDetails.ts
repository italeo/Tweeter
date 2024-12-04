import { BatchGetItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UserDto } from "tweeter-shared";

export async function batchFetchUserDetails(
  client: DynamoDBClient,
  aliases: string[]
): Promise<Map<string, UserDto>> {
  const userMap = new Map<string, UserDto>();
  const tableName = "Users"; // Replace with your actual table name
  const maxRetries = 5; // Maximum number of retries
  const delay = (retryCount: number) =>
    new Promise((res) => setTimeout(res, Math.pow(2, retryCount) * 100)); // Exponential backoff delay

  let retries = 0;
  let unprocessedKeys = aliases;

  while (unprocessedKeys.length > 0 && retries < maxRetries) {
    try {
      const params = {
        RequestItems: {
          [tableName]: {
            Keys: unprocessedKeys.map((alias) => ({
              alias: { S: alias },
            })),
          },
        },
      };

      const result = await client.send(new BatchGetItemCommand(params));

      // Process successfully retrieved items
      if (result.Responses?.[tableName]) {
        result.Responses[tableName].forEach((item) => {
          const alias = item.alias?.S || ""; // Fallback to empty string if undefined
          const firstName = item.firstName?.S || "Unknown"; // Handle missing fields
          const lastName = item.lastName?.S || "Unknown";
          const imageUrl = item.imageUrl?.S || "";

          const user: UserDto = { alias, firstName, lastName, imageUrl }; // Populate UserDto
          userMap.set(alias, user);
        });
      }

      // Handle unprocessed keys
      unprocessedKeys =
        result.UnprocessedKeys?.[tableName]?.Keys?.map(
          (key) => key.alias?.S
        ).filter((alias): alias is string => !!alias) || [];

      if (unprocessedKeys.length > 0) {
        console.warn(`Retrying unprocessed keys: ${unprocessedKeys}`);
      }
    } catch (err) {
      const error = err as Error; // Narrowing the error type
      if (
        error.name === "ProvisionedThroughputExceededException" &&
        retries < maxRetries
      ) {
        retries++;
        console.warn(
          `Throughput exceeded. Retrying (${retries}/${maxRetries})...`
        );
        await delay(retries); // Exponential backoff
      } else {
        console.error("Error batch fetching user details:", error.message);
        throw new Error("Batch fetch operation failed.");
      }
    }
  }

  if (unprocessedKeys.length > 0) {
    console.error("Failed to process all keys after retries:", unprocessedKeys);
    throw new Error("Batch fetch operation failed.");
  }

  return userMap;
}

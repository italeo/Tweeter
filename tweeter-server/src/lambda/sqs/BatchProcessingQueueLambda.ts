import { DynamoDBClient, BatchGetItemCommand } from "@aws-sdk/client-dynamodb";
import { UserDto } from "tweeter-shared";

const dynamoDBClient = new DynamoDBClient({ region: "us-west-2" });
const USERS_TABLE_NAME = "Users";

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
      // Parse the message from BatchProcessingQueue
      const messageBody = JSON.parse(record.body);
      const { aliases }: { aliases: string[] } = messageBody;

      if (!aliases || aliases.length === 0) {
        console.error("No aliases found in message. Skipping.");
        continue;
      }

      console.log(`Fetching user details for ${aliases.length} aliases.`);

      // Split aliases into manageable batches
      const aliasBatches = splitIntoBatches(aliases, 25);

      for (const batch of aliasBatches) {
        const params = {
          RequestItems: {
            [USERS_TABLE_NAME]: {
              Keys: batch.map((alias) => ({ alias: { S: alias } })),
            },
          },
        };

        try {
          const result = await dynamoDBClient.send(
            new BatchGetItemCommand(params)
          );

          if (result.Responses?.[USERS_TABLE_NAME]) {
            result.Responses[USERS_TABLE_NAME].forEach((item) => {
              const alias = item.alias?.S || "";
              const userDetails: UserDto = {
                alias,
                firstName: item.firstName?.S || "Unknown",
                lastName: item.lastName?.S || "Unknown",
                imageUrl: item.imageUrl?.S || "",
              };

              console.log(
                `Fetched details for user: ${JSON.stringify(userDetails)}`
              );
              // Optionally store or process userDetails further
            });
          }

          // Handle unprocessed items
          if (result.UnprocessedKeys?.[USERS_TABLE_NAME]?.Keys) {
            console.warn(
              "Some keys were unprocessed. Retry mechanism may be required."
            );
          }
        } catch (error) {
          console.error("Error fetching user details for batch:", batch, error);
        }
      }
    } catch (error) {
      console.error("Error processing record:", record, error);
    }
  }

  console.log("Batch processing Lambda completed.");
};

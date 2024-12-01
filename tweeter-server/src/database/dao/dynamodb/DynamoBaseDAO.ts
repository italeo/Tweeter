import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
  WriteRequest,
  BatchGetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { User } from "tweeter-shared";

export abstract class DynamoBaseDAO {
  protected readonly client: DynamoDBClient;
  private userCache: Map<string, User> = new Map();

  constructor() {
    this.client = new DynamoDBClient({ region: "us-west-2" });
  }

  // General method to fetch an item from DynamoDB
  protected async getItem(
    tableName: string,
    key: Record<string, any>
  ): Promise<any> {
    const params = { TableName: tableName, Key: key };

    console.log("getItem Params:", JSON.stringify(params, null, 2));

    try {
      const result = await this.client.send(new GetItemCommand(params));
      console.log("getItem Result:", JSON.stringify(result, null, 2));
      return result.Item || null;
    } catch (error) {
      console.error(`Error fetching item from table ${tableName}:`, error);
      throw new Error(`Failed to fetch item: ${JSON.stringify(key)}`);
    }
  }

  // General method to put an item into DynamoDB
  protected async putItem(
    tableName: string,
    item: Record<string, any>
  ): Promise<void> {
    const params = { TableName: tableName, Item: item };

    console.log("putItem Params:", JSON.stringify(params, null, 2));

    try {
      const result = await this.client.send(new PutItemCommand(params));
      console.log("putItem Result:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`Error adding item to table ${tableName}:`, error);
      throw new Error(`Failed to put item: ${JSON.stringify(item)}`);
    }
  }

  // General method to delete an item from DynamoDB
  protected async deleteItem(
    tableName: string,
    key: Record<string, any>
  ): Promise<void> {
    const params = { TableName: tableName, Key: key };

    console.log("deleteItem Params:", JSON.stringify(params, null, 2));

    try {
      const result = await this.client.send(new DeleteItemCommand(params));
      console.log("deleteItem Result:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`Error deleting item from table ${tableName}:`, error);
      throw new Error(`Failed to delete item: ${JSON.stringify(key)}`);
    }
  }

  // General method to perform batch writes (put/delete) in DynamoDB
  protected async batchWrite(
    tableName: string,
    writeRequests: WriteRequest[]
  ): Promise<void> {
    const params: BatchWriteItemCommandInput = {
      RequestItems: { [tableName]: writeRequests },
    };

    console.log("batchWrite Params:", JSON.stringify(params, null, 2));

    try {
      const result = await this.client.send(new BatchWriteItemCommand(params));
      console.log("batchWrite Result:", JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(
        `Error performing batch write on table ${tableName}:`,
        error
      );
      throw new Error("Batch write operation failed.");
    }
  }

  // Fetch user details and cache them
  protected async fetchUserDetails(alias: string): Promise<User | null> {
    if (this.userCache.has(alias)) {
      console.log(`Cache hit for alias: ${alias}`);
      return this.userCache.get(alias)!;
    }

    console.log(
      `Cache miss. Fetching details for alias: ${alias} from DynamoDB`
    );

    try {
      const item = await this.getItem("Users", { alias: { S: alias } });

      if (!item) {
        console.warn(`User not found for alias: ${alias}`);
        return null;
      }

      console.log("User fetched from DB:", JSON.stringify(item, null, 2));

      const user = new User(
        item.firstName?.S || "Unknown",
        item.lastName?.S || "User",
        alias,
        item.imageUrl?.S || "default_image_url",
        item.passwordHash?.S || ""
      );
      this.userCache.set(alias, user);
      return user;
    } catch (error) {
      console.error(`Error fetching user details for alias: ${alias}`, error);
      return null;
    }
  }

  // Fetch user details in bulk and cache them
  protected async batchFetchUserDetails(
    aliases: string[]
  ): Promise<Map<string, User>> {
    const formattedAliases = aliases; // Assume aliases include '@' if stored in DB
    const uncachedAliases = formattedAliases.filter(
      (alias) => !this.userCache.has(alias)
    );
    const resultMap = new Map<string, User>();

    if (uncachedAliases.length > 0) {
      console.log(`Batch fetching details for aliases: ${uncachedAliases}`);

      const keys = uncachedAliases.map((alias) => ({
        alias: { S: alias }, // Ensure key matches the table schema
      }));

      const params = { RequestItems: { Users: { Keys: keys } } };

      console.log(
        "batchFetchUserDetails Params:",
        JSON.stringify(params, null, 2)
      );

      try {
        const response = await this.client.send(
          new BatchGetItemCommand(params)
        );
        const items = response.Responses?.Users || [];
        console.log(
          "batchFetchUserDetails Result:",
          JSON.stringify(items, null, 2)
        );

        for (const item of items) {
          const user = new User(
            item.firstName?.S || "Unknown",
            item.lastName?.S || "User",
            item.alias?.S || "",
            item.imageUrl?.S || "default_image_url",
            item.passwordHash?.S || ""
          );
          this.userCache.set(user.alias, user);
          resultMap.set(user.alias, user);
        }

        if (response.UnprocessedKeys?.Users?.Keys) {
          console.warn(
            "Unprocessed Keys:",
            response.UnprocessedKeys.Users.Keys
          );
          let retryCount = 0;
          const MAX_RETRIES = 3;

          while (
            response.UnprocessedKeys.Users.Keys &&
            retryCount < MAX_RETRIES
          ) {
            retryCount++;
            console.log(`Retrying unprocessed keys (Attempt ${retryCount})`);
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, retryCount))
            );

            const retryResponse = await this.client.send(
              new BatchGetItemCommand({
                RequestItems: response.UnprocessedKeys,
              })
            );
            const retryItems = retryResponse.Responses?.Users || [];
            console.log(
              `Retry Result (Attempt ${retryCount}):`,
              JSON.stringify(retryItems, null, 2)
            );
            for (const item of retryItems) {
              const retryUser = new User(
                item.firstName?.S || "Unknown",
                item.lastName?.S || "User",
                item.alias?.S || "",
                item.imageUrl?.S || "default_image_url",
                item.passwordHash?.S || ""
              );
              this.userCache.set(retryUser.alias, retryUser);
              resultMap.set(retryUser.alias, retryUser);
            }
          }
        }
      } catch (error) {
        console.error("Error batch fetching user details:", error);
        throw new Error("Batch fetch operation failed.");
      }
    }

    for (const alias of formattedAliases) {
      if (this.userCache.has(alias)) {
        resultMap.set(alias, this.userCache.get(alias)!);
      }
    }

    console.log(
      "Final User Map:",
      JSON.stringify(Array.from(resultMap.entries()), null, 2)
    );
    return resultMap;
  }
}

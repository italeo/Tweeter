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

    try {
      const result = await this.client.send(new GetItemCommand(params));
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

    try {
      await this.client.send(new PutItemCommand(params));
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

    try {
      await this.client.send(new DeleteItemCommand(params));
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

    try {
      await this.client.send(new BatchWriteItemCommand(params));
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
    // Remove @ prefix for all aliases
    const formattedAliases = aliases.map((alias) =>
      alias.startsWith("@") ? alias.substring(1) : alias
    );

    // Filter out already cached aliases
    const uncachedAliases = formattedAliases.filter(
      (alias) => !this.userCache.has(alias)
    );
    const resultMap = new Map<string, User>();

    if (uncachedAliases.length > 0) {
      console.log(`Batch fetching details for aliases: ${uncachedAliases}`);

      // Prepare keys for BatchGetItemCommand
      const keys = uncachedAliases.map((alias) => ({
        alias: { S: alias }, // Use formatted alias without '@'
      }));

      console.log("Keys for BatchGetItemCommand:", keys);

      const params = { RequestItems: { Users: { Keys: keys } } };

      try {
        const response = await this.client.send(
          new BatchGetItemCommand(params)
        );
        const items = response.Responses?.Users || [];
        console.log("Raw DynamoDB Response for Users:", items);

        // Process retrieved items
        for (const item of items) {
          const user = new User(
            item.firstName?.S || "Unknown",
            item.lastName?.S || "User",
            item.alias?.S || "",
            item.imageUrl?.S || "default_image_url",
            item.passwordHash?.S || ""
          );
          this.userCache.set(user.alias, user); // Add to cache
          resultMap.set(user.alias, user); // Add to result map
        }

        // Handle unprocessed keys
        if (response.UnprocessedKeys?.Users?.Keys) {
          console.warn(
            "Unprocessed Keys:",
            response.UnprocessedKeys.Users.Keys
          );

          // Retry unprocessed keys
          const unprocessedAliases = response.UnprocessedKeys.Users.Keys.map(
            (key) => key.alias?.S
          ).filter((alias): alias is string => !!alias); // Ensure only non-undefined strings

          const unprocessedResults = await this.batchFetchUserDetails(
            unprocessedAliases
          );

          unprocessedResults.forEach((user, alias) =>
            resultMap.set(alias, user)
          );
        }
      } catch (error) {
        console.error("Error batch fetching user details:", error);
        throw new Error("Batch fetch operation failed.");
      }
    }

    // Add cached users to result map
    for (const alias of formattedAliases) {
      if (this.userCache.has(alias)) {
        resultMap.set(alias, this.userCache.get(alias)!);
      }
    }

    console.log("Final User Map:", resultMap);
    return resultMap;
  }
}

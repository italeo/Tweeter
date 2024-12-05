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
import { User, UserDto } from "tweeter-shared";
import { batchFetchUserDetails } from "./batchFetchUserDetails";

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

  async batchFetchUserDetails(
    aliases: string[]
  ): Promise<Map<string, UserDto>> {
    return await batchFetchUserDetails(this.client, aliases, false);
  }
}

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
import { FakeData } from "tweeter-shared";

export abstract class DynamoBaseDAO {
  protected readonly client: DynamoDBClient;
  private userCache: Map<string, User> = new Map();

  public constructor() {
    this.client = new DynamoDBClient({ region: "us-west-2" });
  }

  // General method to fetch an item from DynamoDB
  protected async getItem(
    tableName: string,
    key: Record<string, any>
  ): Promise<any> {
    const params = {
      TableName: tableName,
      Key: key,
    };

    try {
      return await this.client.send(new GetItemCommand(params));
    } catch (error) {
      console.error(`Error fetching item from table ${tableName}:`, error);
      throw error;
    }
  }

  // General method to put an item into DynamoDB
  protected async putItem(
    tableName: string,
    item: Record<string, any>
  ): Promise<void> {
    const params = {
      TableName: tableName,
      Item: item,
    };

    try {
      await this.client.send(new PutItemCommand(params));
    } catch (error) {
      console.error(`Error adding item to table ${tableName}:`, error);
      throw error;
    }
  }

  // General method to delete an item from DynamoDB
  protected async deleteItem(
    tableName: string,
    key: Record<string, any>
  ): Promise<void> {
    const params = {
      TableName: tableName,
      Key: key,
    };

    try {
      await this.client.send(new DeleteItemCommand(params));
    } catch (error) {
      console.error(`Error deleting item from table ${tableName}:`, error);
      throw error;
    }
  }

  // General method to perform batch writes (put/delete) in DynamoDB
  protected async batchWrite(
    tableName: string,
    writeRequests: WriteRequest[]
  ): Promise<void> {
    const params: BatchWriteItemCommandInput = {
      RequestItems: {
        [tableName]: writeRequests,
      },
    };

    try {
      await this.client.send(new BatchWriteItemCommand(params));
    } catch (error) {
      console.error(
        `Error performing batch write on table ${tableName}:`,
        error
      );
      throw error;
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

    const params = {
      TableName: "Users",
      Key: {
        alias: { S: alias },
      },
    };

    try {
      const data = await this.client.send(new GetItemCommand(params));
      if (data.Item) {
        const user = new User(
          data.Item.firstName?.S || "Unknown",
          data.Item.lastName?.S || "User",
          alias,
          data.Item.imageUrl?.S || "default_image_url",
          data.Item.passwordHash?.S || ""
        );
        this.userCache.set(alias, user);
        return user;
      } else {
        console.warn(
          `User not found for alias: ${alias}. Returning placeholder.`
        );
        return new User("Unknown", "User", alias, "default_image_url", "");
      }
    } catch (error) {
      console.error(`Error fetching user details for alias: ${alias}`, error);
      return new User("Unknown", "User", alias, "default_image_url", "");
    }
  }

  // Fetch using BatchFetching
  protected async batchFetchUserDetails(
    aliases: string[]
  ): Promise<Map<string, User>> {
    const uncachedAliases = aliases.filter(
      (alias) => !this.userCache.has(alias)
    );

    if (uncachedAliases.length === 0) {
      console.log("All user details fetched from cache.");
      return new Map(
        aliases.map((alias) => [alias, this.userCache.get(alias)!])
      );
    }

    console.log(`Batch fetching details for aliases: ${uncachedAliases}`);

    const keys = uncachedAliases.map((alias) => ({ alias: { S: alias } }));
    const params = {
      RequestItems: {
        Users: {
          Keys: keys,
        },
      },
    };

    try {
      const response = await this.client.send(new BatchGetItemCommand(params));
      const items = response.Responses?.Users || [];

      items.forEach((item) => {
        const user = new User(
          item.firstName?.S || "",
          item.lastName?.S || "",
          item.alias?.S || "",
          item.imageUrl?.S || "",
          item.passwordHash?.S || ""
        );

        if (user.firstName && user.lastName && user.imageUrl) {
          this.userCache.set(user.alias, user);
        } else {
          console.error(`Invalid UserDto from batch fetch:`, item);
        }
      });

      return new Map(
        aliases.map((alias) => [alias, this.userCache.get(alias)!])
      );
    } catch (error) {
      console.error("Error batch fetching user details:", error);
      throw error;
    }
  }
}

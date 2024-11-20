import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
  WriteRequest,
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
  protected async fetchUserDetails(alias: string): Promise<User> {
    if (this.userCache.has(alias)) {
      return this.userCache.get(alias)!;
    }

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
          data.Item.lastName?.S || "Unknown",
          alias,
          data.Item.imageUrl?.S || "https://default-image.url"
        );
        this.userCache.set(alias, user);
        return user;
      }
    } catch (error) {
      console.error(`Error fetching user details for alias: ${alias}`, error);
    }

    // Use @allen's details as the fallback
    const allen = FakeData.instance.findUserByAlias("@allen");
    if (allen) {
      this.userCache.set(alias, allen);
      return allen;
    }

    // Fallback to default user
    const fallbackUser = new User(
      "Allen",
      "Anderson",
      "@allen",
      "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/donald_duck.png"
    );
    this.userCache.set(alias, fallbackUser);
    return fallbackUser;
  }
}

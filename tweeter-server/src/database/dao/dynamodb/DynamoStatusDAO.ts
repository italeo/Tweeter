import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { StatusDAO } from "../interfaces/StatusDAO";
import { Status, User } from "tweeter-shared";
import { DynamoUserDAO } from "./DynamoUserDAO";

export class DynamoStatusDAO implements StatusDAO {
  private readonly client: DynamoDBClient;
  private readonly tableName: string = "Statuses";

  public constructor() {
    this.client = new DynamoDBClient({ region: "us-west-2" });
  }

  // Create a new status
  async createStatus(status: Status): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: {
        alias: { S: status.user.alias },
        timestamp: { N: status.timestamp.toString() },
        post: { S: status.post },
      },
    };

    try {
      await this.client.send(new PutItemCommand(params));
      console.log(`Status created successfully for user ${status.user.alias}`);
    } catch (error) {
      console.error(
        `Error creating status for user ${status.user.alias}:`,
        error
      );
      throw error;
    }
  }

  // Get statuses by a user (story)
  async getStatusesByUser(
    userAlias: string,
    limit: number,
    lastKey?: any
  ): Promise<{ statuses: Status[]; lastKey?: any }> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: "alias = :alias",
      ExpressionAttributeValues: {
        ":alias": { S: userAlias },
      },
      Limit: limit,
      ExclusiveStartKey: lastKey,
    };

    try {
      const data = await this.client.send(new QueryCommand(params));
      const statuses: Status[] =
        data.Items?.map(
          (item) =>
            new Status(
              item.post?.S || "No content",
              new User(
                "Unknown", // Placeholder for firstName
                "Unknown", // Placeholder for lastName
                item.alias?.S || "unknown_alias", // Alias from table
                "https://default-image.url" // Placeholder for imageUrl
              ),
              parseInt(item.timestamp?.N || "0")
            )
        ) || [];
      return { statuses, lastKey: data.LastEvaluatedKey };
    } catch (error) {
      console.error(`Error getting statuses for user ${userAlias}:`, error);
      throw error;
    }
  }

  async getFeedForUser(
    userAlias: string,
    limit: number,
    lastKey?: any
  ): Promise<{ statuses: Status[]; lastKey?: any }> {
    const params: QueryCommandInput = {
      TableName: "Feed",
      KeyConditionExpression: "alias = :alias",
      ExpressionAttributeValues: {
        ":alias": { S: userAlias },
      },
      Limit: limit,
      ExclusiveStartKey: lastKey,
    };

    try {
      const data = await this.client.send(new QueryCommand(params));
      const userDAO = new DynamoUserDAO();

      const statuses: Status[] = await Promise.all(
        data.Items?.map(async (item) => {
          const user = await userDAO.getUserByAlias(item.alias?.S || "unknown");
          return new Status(
            item.post?.S || "",
            user || new User("Unknown", "Unknown", "unknown_alias", ""),
            parseInt(item.timestamp?.N || "0")
          );
        }) || []
      );

      return { statuses, lastKey: data.LastEvaluatedKey };
    } catch (error) {
      console.error(`Error getting feed for user ${userAlias}:`, error);
      throw error;
    }
  }

  // Delete a status
  async deleteStatus(statusId: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        id: { S: statusId },
      },
    };

    try {
      await this.client.send(new DeleteItemCommand(params));
      console.log(`Status with ID ${statusId} deleted successfully!`);
    } catch (error) {
      console.error(`Error deleting status with ID ${statusId}:`, error);
      throw error;
    }
  }
}

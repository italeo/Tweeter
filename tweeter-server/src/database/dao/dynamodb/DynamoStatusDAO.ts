import {
  DeleteItemCommand,
  PutItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { StatusDAO } from "../interfaces/StatusDAO";
import { Status, User } from "tweeter-shared";
import { DynamoBaseDAO } from "./DynamoBaseDAO";

export class DynamoStatusDAO extends DynamoBaseDAO implements StatusDAO {
  private readonly tableName: string = "Statuses";

  public constructor() {
    super();
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

      const statuses: Status[] = await Promise.all(
        (data.Items || []).map(async (item) => {
          const user = await this.fetchUserDetails(
            item.alias?.S || "unknown_alias"
          );
          return new Status(
            item.post?.S || "No content",
            user,
            parseInt(item.timestamp?.N || "0")
          );
        })
      );

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

      const statuses: Status[] = await Promise.all(
        (data.Items || []).map(async (item) => {
          const user = await this.fetchUserDetails(
            item.authorAlias?.S || "unknown_alias"
          );
          return new Status(
            item.post?.S || "No content",
            user,
            parseInt(item.timestamp?.N || "0")
          );
        })
      );

      return { statuses, lastKey: data.LastEvaluatedKey };
    } catch (error) {
      console.error(`Error getting feed for user ${userAlias}:`, error);
      throw error;
    }
  }

  async deleteStatus(userAlias: string, timestamp: number): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: userAlias },
        timestamp: { N: timestamp.toString() },
      },
    };

    try {
      await this.client.send(new DeleteItemCommand(params));
      console.log(
        `Status for user ${userAlias} with timestamp ${timestamp} deleted successfully!`
      );
    } catch (error) {
      console.error(`Error deleting status for user ${userAlias}:`, error);
      throw error;
    }
  }
}

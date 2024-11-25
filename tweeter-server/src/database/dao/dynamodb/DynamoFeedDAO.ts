import {
  BatchWriteItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { FeedDAO } from "../interfaces/FeedDAO";
import { Status } from "tweeter-shared";
import { DynamoBaseDAO } from "./DynamoBaseDAO";

export class DynamoFeedDAO extends DynamoBaseDAO implements FeedDAO {
  private readonly tableName: string = "Feed";

  public constructor() {
    super();
  }

  // Add a status to the feed of all followers
  async addStatusToFeed(
    followerAliases: string[],
    status: Status
  ): Promise<void> {
    const writeRequests = followerAliases.map((alias) => ({
      PutRequest: {
        Item: {
          alias: { S: alias },
          timestamp: { N: status.timestamp.toString() },
          post: { S: status.post },
          authorAlias: { S: status.user.alias },
        },
      },
    }));

    const params = {
      RequestItems: {
        [this.tableName]: writeRequests,
      },
    };

    try {
      await this.client.send(new BatchWriteItemCommand(params));
      console.log(
        `Status added to feeds for ${followerAliases.length} followers.`
      );
    } catch (error) {
      console.error(`Error adding status to feeds:`, error);
      throw error;
    }
  }

  // Remove a status from the feed of all followers
  async removeStatusFromFeed(
    followerAliases: string[],
    timestamp: number
  ): Promise<void> {
    const writeRequests = followerAliases.map((alias) => ({
      DeleteRequest: {
        Key: {
          alias: { S: alias },
          timestamp: { N: timestamp.toString() },
        },
      },
    }));

    const params = {
      RequestItems: {
        [this.tableName]: writeRequests,
      },
    };

    try {
      await this.client.send(new BatchWriteItemCommand(params));
      console.log(
        `Status removed from feeds for ${followerAliases.length} followers.`
      );
    } catch (error) {
      console.error(`Error removing status from feeds:`, error);
      throw error;
    }
  }

  // Get feed for a user
  async getFeedForUser(
    userAlias: string,
    pageSize: number,
    lastItem?: Status
  ): Promise<{ statuses: Status[]; hasMore: boolean }> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: "alias = :alias",
      ExpressionAttributeValues: {
        ":alias": { S: userAlias },
      },
      Limit: pageSize,
      ExclusiveStartKey: lastItem
        ? {
            alias: { S: userAlias },
            timestamp: { N: lastItem.timestamp.toString() },
          }
        : undefined,
    };

    try {
      const data = await this.client.send(new QueryCommand(params));

      // Log the raw DynamoDB data
      console.log("Raw DynamoDB Data for Feed:", data.Items);

      const statuses: Status[] = await Promise.all(
        (data.Items || []).map(async (item) => {
          const user = await this.fetchUserDetails(
            item.authorAlias?.S || "unknown_alias"
          );
          if (!user) {
            console.error("User not found for alias:", item.authorAlias?.S);
            throw new Error(`User not found for alias: ${item.authorAlias?.S}`);
          }
          return new Status(
            item.post?.S || "No content",
            user,
            parseInt(item.timestamp?.N || "0")
          );
        })
      );

      const hasMore = !!data.LastEvaluatedKey;
      return { statuses, hasMore };
    } catch (error) {
      console.error(`Error retrieving feed for user ${userAlias}:`, error);
      throw error;
    }
  }
}

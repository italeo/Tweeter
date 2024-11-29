import {
  BatchWriteItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { FeedDAO } from "../interfaces/FeedDAO";
import { Status, UserDto, StatusDto } from "tweeter-shared";
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
    if (followerAliases.length === 0) {
      console.log("No followers to update feeds for. Skipping batch write.");
      return;
    }

    const writeRequests = followerAliases.map((alias) => {
      const aliasWithoutPrefix = alias.startsWith("@")
        ? alias.substring(1)
        : alias;
      return {
        PutRequest: {
          Item: {
            alias: { S: aliasWithoutPrefix },
            timestamp: { N: status.timestamp.toString() },
            post: { S: status.post },
            authorAlias: { S: status.user.alias },
          },
        },
      };
    });

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
    const writeRequests = followerAliases.map((alias) => {
      const aliasWithoutPrefix = alias.startsWith("@")
        ? alias.substring(1)
        : alias;
      return {
        DeleteRequest: {
          Key: {
            alias: { S: aliasWithoutPrefix },
            timestamp: { N: timestamp.toString() },
          },
        },
      };
    });

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
    const aliasWithoutPrefix = userAlias.startsWith("@")
      ? userAlias.substring(1)
      : userAlias;

    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: "alias = :alias",
      ExpressionAttributeValues: {
        ":alias": { S: aliasWithoutPrefix },
      },
      Limit: pageSize,
      ExclusiveStartKey: lastItem
        ? {
            alias: { S: aliasWithoutPrefix },
            timestamp: { N: lastItem.timestamp.toString() },
          }
        : undefined,
    };

    try {
      // Log the query input parameters
      console.log("DynamoDB Query Input for Feed:", params);

      console.log(`Fetching feed for user: ${userAlias}`);
      const data = await this.client.send(new QueryCommand(params));

      // Log the raw data returned from DynamoDB
      console.log("Raw DynamoDB Data for Feed:", data.Items);

      const feedItems = data.Items || [];
      const authorAliases = [
        ...new Set(feedItems.map((item) => item.authorAlias?.S)),
      ].filter((alias): alias is string => !!alias); // Filter out undefined values

      // Log the unique author aliases retrieved
      console.log("Unique Author Aliases:", authorAliases);

      // Batch fetch user details
      const userMap = await this.batchFetchUserDetails(authorAliases);

      // Log the fetched user details
      console.log("Fetched User Details Map:", userMap);

      const statuses = feedItems
        .map((item) => {
          const user = userMap.get(item.authorAlias?.S || "");
          if (!user) {
            console.error("User not found for alias:", item.authorAlias?.S);
            return null;
          }

          return new Status(
            item.post?.S || "",
            user,
            parseInt(item.timestamp?.N || "0")
          );
        })
        .filter((status): status is Status => status !== null);

      const hasMore = !!data.LastEvaluatedKey;

      // Log the final processed statuses and pagination information
      console.log(`Processed Feed Items:`, statuses);
      console.log(`Has More Items: ${hasMore}`);

      return { statuses, hasMore };
    } catch (error) {
      console.error(`Error retrieving feed for user ${userAlias}:`, error);
      throw error;
    }
  }
}

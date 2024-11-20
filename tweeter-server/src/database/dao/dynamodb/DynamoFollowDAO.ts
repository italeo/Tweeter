import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { FollowDAO } from "../interfaces/FollowDAO";
import { UserDto } from "tweeter-shared";

export class DynamoFollowDAO implements FollowDAO {
  private readonly client: DynamoDBClient;
  private readonly tableName: string = "Followers";

  public constructor() {
    this.client = new DynamoDBClient({ region: "us-west-2" });
  }

  // Follow a user
  async followUser(
    followerAlias: string,
    followeeAlias: string
  ): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: {
        followerAlias: { S: followerAlias },
        followeeAlias: { S: followeeAlias },
      },
    };

    try {
      await this.client.send(new PutItemCommand(params));
      console.log(
        `Follow relationship created: ${followerAlias} -> ${followeeAlias}`
      );
    } catch (error) {
      console.error(
        `Error creating follow relationship: ${followerAlias} -> ${followeeAlias}`,
        error
      );
      throw error;
    }
  }

  // Unfollow a user
  async unfollowUser(
    followerAlias: string,
    followeeAlias: string
  ): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        followerAlias: { S: followerAlias },
        followeeAlias: { S: followeeAlias },
      },
    };

    try {
      await this.client.send(new DeleteItemCommand(params));
      console.log(
        `Follow relationship deleted: ${followerAlias} -> ${followeeAlias}`
      );
    } catch (error) {
      console.error(
        `Error deleting follow relationship: ${followerAlias} -> ${followeeAlias}`,
        error
      );
      throw error;
    }
  }

  // Get followers of a user
  async getFollowers(
    userAlias: string,
    pageSize: number,
    lastItem?: UserDto
  ): Promise<{ followers: UserDto[]; hasMore: boolean }> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: "FollowerIndex",
      KeyConditionExpression: "followeeAlias = :followeeAlias",
      ExpressionAttributeValues: {
        ":followeeAlias": { S: userAlias },
      },
      Limit: pageSize,
      ExclusiveStartKey: lastItem
        ? {
            followerAlias: { S: lastItem.alias },
            followeeAlias: { S: userAlias },
          }
        : undefined,
    };

    try {
      const data = await this.client.send(new QueryCommand(params));
      const followers: UserDto[] =
        data.Items?.map((item) => ({
          alias: item.followerAlias?.S || "Unknown",
          firstName: "Unknown",
          lastName: "Unknown",
          imageUrl: "https://default-image.url",
        })) || [];

      const hasMore = !!data.LastEvaluatedKey;

      return { followers, hasMore };
    } catch (error) {
      console.error(`Error retrieving followers for ${userAlias}:`, error);
      throw error;
    }
  }

  // Get followees of a user
  async getFollowees(
    userAlias: string,
    pageSize: number,
    lastItem?: UserDto
  ): Promise<{ followees: UserDto[]; hasMore: boolean }> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: "followerAlias = :followerAlias",
      ExpressionAttributeValues: {
        ":followerAlias": { S: userAlias },
      },
      Limit: pageSize,
      ExclusiveStartKey: lastItem
        ? {
            followerAlias: { S: userAlias },
            followeeAlias: { S: lastItem.alias },
          }
        : undefined,
    };

    try {
      const data = await this.client.send(new QueryCommand(params));
      const followees: UserDto[] =
        data.Items?.map((item) => ({
          alias: item.followeeAlias?.S || "Unknown",
          firstName: "Unknown",
          lastName: "Unknown",
          imageUrl: "https://default-image.url",
        })) || [];
      const hasMore = !!data.LastEvaluatedKey;

      return { followees, hasMore };
    } catch (error) {
      console.error(`Error retrieving followees for ${userAlias}:`, error);
      throw error;
    }
  }

  // Check if a user is following another user
  async isUserFollowing(
    followerAlias: string,
    followeeAlias: string
  ): Promise<boolean> {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression:
        "followerAlias = :followerAlias AND followeeAlias = :followeeAlias",
      ExpressionAttributeValues: {
        ":followerAlias": { S: followerAlias },
        ":followeeAlias": { S: followeeAlias },
      },
    };

    try {
      const data = await this.client.send(new QueryCommand(params));
      return data.Count !== undefined && data.Count > 0;
    } catch (error) {
      console.error(
        `Error checking follow relationship: ${followerAlias} -> ${followeeAlias}`,
        error
      );
      throw error;
    }
  }

  // Get follower count
  async getFollowerCount(userAlias: string): Promise<number> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: "FollowerIndex", // Assuming a GSI on followerAlias
      KeyConditionExpression: "followeeAlias = :followeeAlias",
      ExpressionAttributeValues: {
        ":followeeAlias": { S: userAlias },
      },
      Select: "COUNT",
    };

    try {
      const data = await this.client.send(new QueryCommand(params));
      return data.Count || 0;
    } catch (error) {
      console.error(`Error retrieving follower count for ${userAlias}:`, error);
      throw error;
    }
  }

  // Get followee count
  async getFolloweeCount(userAlias: string): Promise<number> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: "followerAlias = :followerAlias",
      ExpressionAttributeValues: {
        ":followerAlias": { S: userAlias },
      },
      Select: "COUNT",
    };

    try {
      const data = await this.client.send(new QueryCommand(params));
      return data.Count || 0;
    } catch (error) {
      console.error(`Error retrieving followee count for ${userAlias}:`, error);
      throw error;
    }
  }
}

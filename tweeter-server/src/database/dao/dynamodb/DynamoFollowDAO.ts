import {
  QueryCommand,
  QueryCommandInput,
  PutItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { FollowDAO } from "../interfaces/FollowDAO";
import { UserDto } from "tweeter-shared";
import { DynamoBaseDAO } from "./DynamoBaseDAO";

export class DynamoFollowDAO extends DynamoBaseDAO implements FollowDAO {
  private readonly tableName: string = "Followers";

  public constructor() {
    super();
  }

  // Follow a user
  async followUser(
    followerAlias: string,
    followeeAlias: string
  ): Promise<void> {
    // Check if the relationship already exists
    const isFollowing = await this.isUserFollowing(
      followerAlias,
      followeeAlias
    );

    if (isFollowing) {
      console.warn(
        `User ${followerAlias} is already following ${followeeAlias}`
      );
      return;
    }

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
    // Check if the relationship exists
    const isFollowing = await this.isUserFollowing(
      followerAlias,
      followeeAlias
    );

    if (!isFollowing) {
      console.warn(
        `No follow relationship exists: ${followerAlias} -> ${followeeAlias}`
      );
      return;
    }

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

      // Fetch user details for followers
      const followers: (UserDto | null)[] = await Promise.all(
        (data.Items || []).map(async (item) => {
          const userAlias = item.followerAlias?.S || "unknown_alias";
          const user = await this.fetchUserDetails(userAlias); // Use fetchUserDetails
          if (!user) {
            console.warn(`User details not found for alias: ${userAlias}`);
            return null; // Skip invalid entries
          }
          return {
            alias: user.alias,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          };
        })
      );

      // Remove null values and ensure TypeScript understands this
      const validFollowers = followers.filter(
        (follower): follower is UserDto => follower !== null
      );

      const hasMore = !!data.LastEvaluatedKey;
      return { followers: validFollowers, hasMore };
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
      IndexName: "FolloweeIndex",
      KeyConditionExpression: "followerAlias = :followerAlias",
      ExpressionAttributeValues: {
        ":followerAlias": { S: userAlias },
      },
      Limit: pageSize,
      ExclusiveStartKey: lastItem
        ? {
            followerAlias: { S: userAlias }, // Partition key
            followeeAlias: { S: lastItem.alias }, // Sort key
          }
        : undefined,
    };

    try {
      const data = await this.client.send(new QueryCommand(params));

      // Fetch user details for followees
      const followees: (UserDto | null)[] = await Promise.all(
        (data.Items || []).map(async (item) => {
          const userAlias = item.followeeAlias?.S || "unknown_alias";
          const user = await this.fetchUserDetails(userAlias); // Use fetchUserDetails
          if (!user) {
            console.warn(`User details not found for alias: ${userAlias}`);
            return null; // Skip invalid entries
          }
          return {
            alias: user.alias,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          };
        })
      );

      // Remove null values and ensure TypeScript understands this
      const validFollowees = followees.filter(
        (followee): followee is UserDto => followee !== null
      );

      const hasMore = !!data.LastEvaluatedKey;
      return { followees: validFollowees, hasMore };
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
      IndexName: "FollowerIndex",
      KeyConditionExpression: "followeeAlias = :followeeAlias",
      ExpressionAttributeValues: {
        ":followeeAlias": { S: userAlias },
      },
      Select: "COUNT",
      ConsistentRead: false, // Ensure this is false or omit this line
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
      IndexName: "FolloweeIndex",
      KeyConditionExpression: "followerAlias = :followerAlias",
      ExpressionAttributeValues: {
        ":followerAlias": { S: userAlias },
      },
      Select: "COUNT",
      ConsistentRead: false, // Ensure this is false or omit this line
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

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
    console.log("Starting followUser...");
    console.log(`Follower: ${followerAlias}, Followee: ${followeeAlias}`);

    // Check if the relationship already exists
    const isFollowing = await this.isUserFollowing(
      followerAlias,
      followeeAlias
    );
    console.log(`Is user already following: ${isFollowing}`);

    if (isFollowing) {
      console.warn(
        `User ${followerAlias} is already following ${followeeAlias}`
      );
      return;
    }

    // Prepare parameters for PutItemCommand
    const params = {
      TableName: this.tableName,
      Item: {
        followerAlias: { S: followerAlias },
        followeeAlias: { S: followeeAlias },
      },
    };

    console.log("PutItemCommand Params:", JSON.stringify(params, null, 2));

    try {
      // Execute the PutItemCommand
      const result = await this.client.send(new PutItemCommand(params));
      console.log(
        `Follow relationship created successfully: ${followerAlias} -> ${followeeAlias}`
      );
      console.log("PutItemCommand Result:", JSON.stringify(result, null, 2));

      // Verify the record exists after insertion
      const postCheck = await this.isUserFollowing(
        followerAlias,
        followeeAlias
      );
      console.log(`Post-insertion check: Is user following? ${postCheck}`);
    } catch (error) {
      console.error(`Error creating follow relationship:`, error);
      throw error; // Re-throw error to propagate
    }
  }

  // Unfollow a user
  async unfollowUser(
    followerAlias: string,
    followeeAlias: string
  ): Promise<void> {
    console.log("Starting unfollowUser...");
    console.log(`Follower: ${followerAlias}, Followee: ${followeeAlias}`);

    // Check if the relationship exists
    const isFollowing = await this.isUserFollowing(
      followerAlias,
      followeeAlias
    );
    console.log(`Does follow relationship exist: ${isFollowing}`);

    if (!isFollowing) {
      console.warn(
        `No follow relationship exists: ${followerAlias} -> ${followeeAlias}`
      );
      return;
    }

    // Prepare parameters for DeleteItemCommand
    const params = {
      TableName: this.tableName,
      Key: {
        followeeAlias: { S: followeeAlias },
        followerAlias: { S: followerAlias },
      },
    };

    console.log("DeleteItemCommand Params:", JSON.stringify(params, null, 2));

    try {
      // Execute the DeleteItemCommand
      const result = await this.client.send(new DeleteItemCommand(params));
      console.log(
        `Follow relationship deleted successfully: ${followerAlias} -> ${followeeAlias}`
      );
      console.log("DeleteItemCommand Result:", JSON.stringify(result, null, 2));

      // Verify the record no longer exists after deletion
      const postCheck = await this.isUserFollowing(
        followerAlias,
        followeeAlias
      );
      console.log(`Post-deletion check: Is user following? ${postCheck}`);
    } catch (error) {
      console.error(`Error deleting follow relationship:`, error);
      throw error; // Re-throw error to propagate
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
    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression:
        "followeeAlias = :followeeAlias AND followerAlias = :followerAlias",
      ExpressionAttributeValues: {
        ":followeeAlias": { S: followeeAlias },
        ":followerAlias": { S: followerAlias },
      },
      Limit: 1,
    };

    console.log(
      "QueryCommand Params for isUserFollowing:",
      JSON.stringify(params, null, 2)
    );

    try {
      const data = await this.client.send(new QueryCommand(params));
      console.log(
        "QueryCommand Result for isUserFollowing:",
        JSON.stringify(data, null, 2)
      );
      console.log(
        "isUserFollowing result:",
        !!(data.Items && data.Items.length > 0)
      );

      return !!(data.Items && data.Items.length > 0);
    } catch (error) {
      console.error(`Error in isUserFollowing:`, error);
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

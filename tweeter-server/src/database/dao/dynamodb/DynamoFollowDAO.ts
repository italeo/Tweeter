import {
  QueryCommand,
  QueryCommandInput,
  TransactWriteItemsCommand,
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
    console.log(`Starting followUser: ${followerAlias} -> ${followeeAlias}`);

    try {
      const params = {
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: {
                followerAlias: { S: followerAlias },
                followeeAlias: { S: followeeAlias },
              },
              ConditionExpression:
                "attribute_not_exists(followerAlias) AND attribute_not_exists(followeeAlias)",
            },
          },
        ],
      };

      await this.client.send(new TransactWriteItemsCommand(params));
      console.log(
        `Follow relationship created: ${followerAlias} -> ${followeeAlias}`
      );
    } catch (error) {
      console.error(`Error creating follow relationship:`, error);
      throw error;
    }
  }

  // Unfollow a user
  async unfollowUser(
    followerAlias: string,
    followeeAlias: string
  ): Promise<void> {
    console.log(
      `Starting unfollowUser operation: ${followerAlias} -> ${followeeAlias}`
    );

    const deleteParams = {
      TransactItems: [
        {
          Delete: {
            TableName: this.tableName,
            Key: {
              followeeAlias: { S: followeeAlias },
              followerAlias: { S: followerAlias },
            },
            ConditionExpression:
              "attribute_exists(followerAlias) AND attribute_exists(followeeAlias)",
          },
        },
      ],
    };

    console.log(
      "Prepared deleteParams for TransactWriteItemsCommand:",
      JSON.stringify(deleteParams, null, 2)
    );

    try {
      console.log("Checking if the item exists before attempting to delete...");

      // Query the table to check if the item exists
      const checkItemParams = {
        TableName: this.tableName,
        KeyConditionExpression:
          "followeeAlias = :followeeAlias AND followerAlias = :followerAlias",
        ExpressionAttributeValues: {
          ":followeeAlias": { S: followeeAlias },
          ":followerAlias": { S: followerAlias },
        },
      };

      const checkItemResult = await this.client.send(
        new QueryCommand(checkItemParams)
      );
      console.log(
        "Item existence check result:",
        JSON.stringify(checkItemResult, null, 2)
      );

      if (!checkItemResult.Items || checkItemResult.Items.length === 0) {
        console.warn(
          `Item to delete does not exist: ${followerAlias} -> ${followeeAlias}`
        );
      } else {
        console.log(
          `Item exists. Proceeding with delete operation: ${followerAlias} -> ${followeeAlias}`
        );
      }

      // Attempt the delete operation
      await this.client.send(new TransactWriteItemsCommand(deleteParams));
      console.log(
        `Follow relationship successfully deleted: ${followerAlias} -> ${followeeAlias}`
      );
    } catch (err) {
      // Narrowing error type
      const error = err as Error;
      console.error(
        `Error during delete operation for ${followerAlias} -> ${followeeAlias}:`,
        error.message
      );

      if (
        error.name === "TransactionCanceledException" &&
        error.message.includes("ConditionalCheckFailed")
      ) {
        console.error(
          `Conditional check failed. The follow relationship between ${followerAlias} and ${followeeAlias} might not exist.`
        );
      } else if (error.name === "ValidationException") {
        console.error(
          "ValidationException: Check the keys or condition expressions for correctness."
        );
      }

      console.log("Re-checking the current table state for debugging...");
      try {
        const tableScanParams = {
          TableName: this.tableName,
          Limit: 10, // Limit the scan to a few items for debugging
        };

        const tableScanResult = await this.client.send(
          new QueryCommand(tableScanParams)
        );
        console.log(
          "Table state after error:",
          JSON.stringify(tableScanResult, null, 2)
        );
      } catch (scanError) {
        const scanErrorTyped = scanError as Error;
        console.error(
          "Error scanning the table for debugging:",
          scanErrorTyped.message
        );
      }

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
      const aliases = (data.Items || []).map(
        (item) => item.followerAlias?.S || "unknown_alias"
      );

      // Batch fetch user details
      const userMap = await this.batchFetchUserDetails(aliases);

      // Map fetched users to UserDto and filter out undefined
      const followers: UserDto[] = aliases
        .map((alias) => {
          const user = userMap.get(alias);
          if (user) {
            return user; // Convert to UserDto
          }
          return undefined; // Handle missing users
        })
        .filter((user): user is UserDto => user !== undefined); // Type-safe filter

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
      const aliases = (data.Items || []).map(
        (item) => item.followeeAlias?.S || "unknown_alias"
      );

      // Batch fetch user details
      const userMap = await this.batchFetchUserDetails(aliases);

      // Map fetched users to UserDto and filter out undefined
      const followees: UserDto[] = aliases
        .map((alias) => {
          const user = userMap.get(alias);
          if (user) {
            return user; // Convert to UserDto
          }
          return undefined; // Handle missing users
        })
        .filter((user): user is UserDto => user !== undefined); // Type-safe filter

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

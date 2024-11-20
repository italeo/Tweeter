import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { UserDAO } from "../interfaces/UserDAO";
import { User } from "tweeter-shared";

export class DynamoUserDAO implements UserDAO {
  private readonly client: DynamoDBClient;
  private readonly tableName: string = "Users";

  public constructor() {
    this.client = new DynamoDBClient({ region: "us-west-2" });
  }

  // Adds a User to the Users table
  async createUser(user: User): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: {
        alias: { S: user.alias },
        firstName: { S: user.firstName },
        lastName: { S: user.lastName },
        imageUrl: { S: user.imageUrl },
      },
    };

    try {
      await this.client.send(new PutItemCommand(params));
      console.log(`User ${user.alias} added successfully!`);
    } catch (error) {
      console.error(`Error adding user ${user.alias}:`, error);
      throw error;
    }
  }

  // Gets/retrieves a User by their alias
  async getUserByAlias(alias: string): Promise<User | null> {
    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: alias },
      },
    };

    try {
      const data = await this.client.send(new GetItemCommand(params));
      if (data.Item) {
        return new User(
          data.Item.firstName?.S || "Unknown",
          data.Item.lastName?.S || "Unknown",
          data.Item.alias?.S || "unknown_alias",
          data.Item.imageUrl?.S || "https://default-image.url"
        );
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error retrieving user with alias ${alias}:`, error);
      throw error;
    }
  }

  // Updating the User information
  async updateUser(user: User): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: { [key: string]: any } = {};

    if (user.firstName) {
      updateExpressions.push("firstName = :firstName");
      expressionAttributeValues[":firstName"] = { S: user.firstName };
    }

    if (user.lastName) {
      updateExpressions.push("lastName = :lastName");
      expressionAttributeValues[":lastName"] = { S: user.lastName };
    }

    if (user.imageUrl) {
      updateExpressions.push("imageUrl = :imageUrl");
      expressionAttributeValues[":imageUrl"] = { S: user.imageUrl };
    }

    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: user.alias },
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    try {
      await this.client.send(new UpdateItemCommand(params));
      console.log(`User ${user.alias} updated successfully!`);
    } catch (error) {
      console.error(`Error updating user ${user.alias}:`, error);
      throw error;
    }
  }

  // Delete a user
  async deleteUser(alias: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: alias },
      },
    };

    try {
      await this.client.send(new DeleteItemCommand(params));
      console.log(`User ${alias} deleted successfully!`);
    } catch (error) {
      console.error(`Error deleting user ${alias}:`, error);
      throw error;
    }
  }

  // Increment followers count
  async incrementFollowersCount(alias: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: alias },
      },
      UpdateExpression:
        "SET followersCount = if_not_exists(followersCount, :zero) + :inc",
      ExpressionAttributeValues: {
        ":inc": { N: "1" },
        ":zero": { N: "0" },
      },
    };

    try {
      await this.client.send(new UpdateItemCommand(params));
      console.log(
        `Followers count for user ${alias} incremented successfully!`
      );
    } catch (error) {
      console.error(
        `Error incrementing followers count for user ${alias}:`,
        error
      );
      throw error;
    }
  }

  // Decrement followers count
  async decrementFollowersCount(alias: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: alias },
      },
      UpdateExpression: "SET followersCount = followersCount - :dec",
      ConditionExpression: "followersCount > :zero",
      ExpressionAttributeValues: {
        ":dec": { N: "1" },
        ":zero": { N: "0" },
      },
    };

    try {
      await this.client.send(new UpdateItemCommand(params));
      console.log(
        `Followers count for user ${alias} decremented successfully!`
      );
    } catch (error) {
      console.error(
        `Error decrementing followers count for user ${alias}:`,
        error
      );
      throw error;
    }
  }

  // Increment following count
  async incrementFollowingCount(alias: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: alias },
      },
      UpdateExpression:
        "SET followingCount = if_not_exists(followingCount, :zero) + :inc",
      ExpressionAttributeValues: {
        ":inc": { N: "1" },
        ":zero": { N: "0" },
      },
    };

    try {
      await this.client.send(new UpdateItemCommand(params));
      console.log(
        `Following count for user ${alias} incremented successfully!`
      );
    } catch (error) {
      console.error(
        `Error incrementing following count for user ${alias}:`,
        error
      );
      throw error;
    }
  }

  // Decrement following count
  async decrementFollowingCount(alias: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: alias },
      },
      UpdateExpression: "SET followingCount = followingCount - :dec",
      ConditionExpression: "followingCount > :zero",
      ExpressionAttributeValues: {
        ":dec": { N: "1" },
        ":zero": { N: "0" },
      },
    };

    try {
      await this.client.send(new UpdateItemCommand(params));
      console.log(
        `Following count for user ${alias} decremented successfully!`
      );
    } catch (error) {
      console.error(
        `Error decrementing following count for user ${alias}:`,
        error
      );
      throw error;
    }
  }
}

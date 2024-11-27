import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { UserDAO } from "../interfaces/UserDAO";
import { User } from "tweeter-shared";
import { DynamoBaseDAO } from "./DynamoBaseDAO";
import { DynamoS3ProfileImageDAO } from "../s3/DynamoS3ProfileImageDAO";

export class DynamoUserDAO extends DynamoBaseDAO implements UserDAO {
  private readonly tableName: string = "Users";
  private profileImageDAO: DynamoS3ProfileImageDAO;

  public constructor(profileImageDAO: DynamoS3ProfileImageDAO) {
    super();
    this.profileImageDAO = profileImageDAO;
  }

  // Adds a User to the Users table
  async createUser(user: User): Promise<void> {
    // Ensure alias has `@` prefix
    const aliasWithPrefix = user.alias.startsWith("@")
      ? user.alias
      : `@${user.alias}`;

    if (!user.password) {
      throw new Error("Password is required to create a user.");
    }

    const hashedPassword = user.password; // Assume already hashed before passing
    const params = {
      TableName: this.tableName,
      Item: {
        alias: { S: aliasWithPrefix }, // Store alias with `@` prefix
        firstName: { S: user.firstName },
        lastName: { S: user.lastName },
        imageUrl: { S: user.imageUrl },
        passwordHash: { S: hashedPassword },
      },
    };

    try {
      await this.client.send(new PutItemCommand(params));
      console.log(`User ${aliasWithPrefix} added successfully.`);
    } catch (error) {
      console.error(`Error adding user ${aliasWithPrefix}:`, error);
      throw new Error(`Failed to create user: ${aliasWithPrefix}`);
    }
  }

  async createUserWithPassword(
    user: User,
    hashedPassword: string
  ): Promise<void> {
    // Ensure alias has `@` prefix
    const aliasWithPrefix = user.alias.startsWith("@")
      ? user.alias
      : `@${user.alias}`;

    const params = {
      TableName: this.tableName,
      Item: {
        alias: { S: aliasWithPrefix }, // Store alias with `@` prefix
        firstName: { S: user.firstName },
        lastName: { S: user.lastName },
        imageUrl: { S: user.imageUrl },
        passwordHash: { S: hashedPassword },
      },
    };

    try {
      await this.client.send(new PutItemCommand(params));
      console.log(
        `User ${aliasWithPrefix} with password created successfully.`
      );
    } catch (error) {
      console.error(`Error creating user ${aliasWithPrefix}:`, error);
      throw error;
    }
  }

  async updateProfileImage(
    userAlias: string,
    fileBuffer: Buffer,
    fileType: string
  ): Promise<void> {
    const imageUrl = await this.profileImageDAO.uploadProfileImage(
      userAlias,
      fileBuffer,
      fileType
    );

    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: userAlias },
      },
      UpdateExpression: "SET imageUrl = :imageUrl",
      ExpressionAttributeValues: {
        ":imageUrl": { S: imageUrl },
      },
    };

    try {
      await this.client.send(new UpdateItemCommand(params));
      console.log(`Profile image URL updated for user ${userAlias}`);
    } catch (error) {
      console.error(
        `Error updating profile image URL for user ${userAlias}:`,
        error
      );
      throw error;
    }
  }

  // Gets/retrieves a User by their alias
  async getUserByAlias(alias: string): Promise<User | null> {
    // Strip `@` prefix from alias for query
    const aliasWithoutPrefix = alias.startsWith("@")
      ? alias.substring(1)
      : alias;

    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: aliasWithoutPrefix },
      },
    };

    try {
      const result = await this.client.send(new GetItemCommand(params));
      if (result.Item) {
        return new User(
          result.Item.firstName?.S || "Unknown",
          result.Item.lastName?.S || "Unknown",
          `@${aliasWithoutPrefix}`, // Add `@` prefix back
          result.Item.imageUrl?.S || "",
          result.Item.passwordHash?.S || "defaultPasswordHash"
        );
      }
      console.warn(`User with alias ${alias} not found.`);
      return null; // Return null if user does not exist
    } catch (error) {
      console.error(`Error fetching user by alias ${alias}:`, error);
      throw new Error(`Failed to fetch user: ${alias}`);
    }
  }

  async getPasswordHash(alias: string): Promise<string> {
    // Strip `@` prefix from alias for query
    const aliasWithoutPrefix = alias.startsWith("@")
      ? alias.substring(1)
      : alias;

    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: aliasWithoutPrefix },
      },
      ProjectionExpression: "passwordHash",
    };

    try {
      const result = await this.client.send(new GetItemCommand(params));
      if (result.Item && result.Item.passwordHash?.S) {
        return result.Item.passwordHash.S;
      }
      throw new Error("Password hash not found for user.");
    } catch (error) {
      console.error(`Error fetching password hash for alias ${alias}:`, error);
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

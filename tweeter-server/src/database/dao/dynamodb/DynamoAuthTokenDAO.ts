import { AuthToken } from "tweeter-shared";
import { AuthTokenDAO } from "../interfaces/AuthTokenDAO";
import { DynamoBaseDAO } from "./DynamoBaseDAO";
import {
  DeleteItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  WriteRequest,
} from "@aws-sdk/client-dynamodb";

export class DynamoAuthTokenDAO extends DynamoBaseDAO implements AuthTokenDAO {
  private readonly tableName = "AuthTokens";

  constructor() {
    super();
  }

  // Create a new AuthToken
  async createAuthToken(authToken: AuthToken): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: {
        token: { S: authToken.token },
        timestamp: { N: authToken.timestamp.toString() },
      },
    };

    try {
      await this.client.send(new PutItemCommand(params));
      console.log(`AuthToken ${authToken.token} created successfully.`);
    } catch (error) {
      console.error(`Error creating AuthToken:`, error);
      throw error;
    }
  }

  // Get an AuthToken by its token string
  async getAuthToken(token: string): Promise<AuthToken | null> {
    const item = await this.getItem(this.tableName, { token: { S: token } });

    if (!item) {
      return null;
    }

    return new AuthToken(item.token.S!, parseInt(item.timestamp.N || "0"));
  }

  // Delete an AuthToken by its token string
  async deleteAuthToken(token: string): Promise<void> {
    try {
      await this.deleteItem(this.tableName, { token: { S: token } });
      console.log(`AuthToken ${token} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting AuthToken ${token}:`, error);
      throw error;
    }
  }

  // Delete expired AuthTokens using Scan
  async deleteExpiredTokens(expirationTime: number): Promise<void> {
    const params = {
      TableName: this.tableName,
      FilterExpression: "timestamp <= :expirationTime",
      ExpressionAttributeValues: {
        ":expirationTime": { N: expirationTime.toString() },
      },
    };

    try {
      const expiredTokens = await this.client.send(new ScanCommand(params));

      if (expiredTokens.Items) {
        const deleteRequests: WriteRequest[] = expiredTokens.Items.flatMap(
          (item) =>
            item.token?.S
              ? [
                  {
                    DeleteRequest: {
                      Key: {
                        token: { S: item.token.S },
                      },
                    },
                  },
                ]
              : []
        );

        if (deleteRequests.length > 0) {
          await this.batchWrite(this.tableName, deleteRequests);
          console.log(`Deleted expired tokens successfully.`);
        } else {
          console.log("No expired tokens to delete.");
        }
      }
    } catch (error) {
      console.error(`Error deleting expired tokens:`, error);
      throw error;
    }
  }
}

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

  public async createAuthToken(authToken: AuthToken): Promise<void> {
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

  async storeToken(authToken: AuthToken): Promise<void> {
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
      throw new Error(`Failed to store AuthToken: ${authToken.token}`);
    }
  }

  async getAuthToken(token: string): Promise<AuthToken | null> {
    try {
      const item = await this.getItem(this.tableName, { token: { S: token } });

      if (item && item.token?.S && item.timestamp?.N) {
        return new AuthToken(item.token.S, parseInt(item.timestamp.N, 10));
      }

      console.warn(`AuthToken not found for token: ${token}`);
      return null;
    } catch (error) {
      console.error(`Error fetching AuthToken for token ${token}:`, error);
      throw new Error(`Failed to retrieve AuthToken: ${token}`);
    }
  }

  async deleteAuthToken(token: string): Promise<void> {
    try {
      await this.deleteItem(this.tableName, { token: { S: token } });
      console.log(`AuthToken ${token} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting AuthToken ${token}:`, error);
      throw new Error(`Failed to delete AuthToken: ${token}`);
    }
  }

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
          (item) => {
            const token = item.token?.S;
            if (token) {
              return [
                {
                  DeleteRequest: {
                    Key: {
                      token: { S: token },
                    },
                  },
                },
              ];
            }
            return []; // Skip if token is undefined
          }
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

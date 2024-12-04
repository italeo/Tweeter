import {
  DeleteItemCommand,
  PutItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { StatusDAO } from "../interfaces/StatusDAO";
import { Status } from "tweeter-shared";
import { DynamoBaseDAO } from "./DynamoBaseDAO";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { DynamoFollowDAO } from "./DynamoFollowDAO";

export class DynamoStatusDAO extends DynamoBaseDAO implements StatusDAO {
  private readonly tableName: string = "Statuses";
  private readonly sqsClient: SQSClient;
  private readonly feedUpdateQueueUrl: string =
    "https://sqs.us-west-2.amazonaws.com/506149017946/FeedUpdateQueue";
  private readonly followDAO: DynamoFollowDAO;

  public constructor() {
    super();
    this.sqsClient = new SQSClient({});
    this.followDAO = new DynamoFollowDAO();
  }

  // Create a new status
  async createStatus(status: Status): Promise<void> {
    const params = {
      TableName: this.tableName,
      Item: {
        alias: { S: status.user.alias },
        timestamp: { N: status.timestamp.toString() },
        post: { S: status.post },
      },
    };

    try {
      // Step 1: Write status to the Statuses table
      await this.client.send(new PutItemCommand(params));
      console.log(`Status created successfully for user ${status.user.alias}`);

      // Step 2: Fetch all followers dynamically using DynamoFollowDAO
      const followers = [];
      let lastItem;

      do {
        const response = await this.followDAO.getFollowers(
          status.user.alias,
          100,
          lastItem
        );
        followers.push(...response.followers.map((f) => f.alias));
        lastItem = response.hasMore
          ? response.followers[response.followers.length - 1]
          : undefined;
      } while (lastItem);

      console.log(
        `Fetched ${followers.length} followers for ${status.user.alias}.`
      );

      if (followers.length === 0) {
        console.log("No followers found. Skipping SQS message.");
        return;
      }

      // Step 3: Construct message for SQS
      const message = {
        statusId: status.timestamp,
        authorAlias: status.user.alias,
        post: status.post,
        followers: followers, // Add fetched followers to the message
        timestamp: status.timestamp,
      };

      const sqsParams = {
        QueueUrl: this.feedUpdateQueueUrl,
        MessageBody: JSON.stringify(message),
      };

      // Step 4: Send the message to the Feed Update Queue
      await this.sqsClient.send(new SendMessageCommand(sqsParams));
      console.log("Message sent to Feed Update Queue successfully.");
    } catch (error) {
      console.error(
        `Error creating status for user ${status.user.alias}:`,
        error
      );
      throw error;
    }
  }

  async getStatusesByUser(
    userAlias: string,
    limit: number,
    lastKey?: any
  ): Promise<{ statuses: Status[]; lastKey?: any }> {
    console.log("LastItem received for ExclusiveStartKey:", lastKey);

    const params: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: "alias = :alias",
      ExpressionAttributeValues: {
        ":alias": { S: userAlias },
      },
      Limit: limit,
      ScanIndexForward: false, // Retrieve items in descending order by timestamp
      ExclusiveStartKey:
        lastKey && lastKey.alias && lastKey.timestamp
          ? {
              alias: { S: lastKey.alias },
              timestamp: { N: lastKey.timestamp.toString() },
            }
          : undefined,
    };

    console.log("DynamoDB Query Parameters:", JSON.stringify(params, null, 2));

    try {
      const data = await this.client.send(new QueryCommand(params));
      console.log("DynamoDB Query Result:", JSON.stringify(data, null, 2));

      const statuses: (Status | null)[] = await Promise.all(
        (data.Items || []).map(async (item) => {
          const alias = item.alias?.S || "unknown_alias";
          console.log(`Processing status item for alias: ${alias}`);

          const user = await this.fetchUserDetails(alias).catch((err) => {
            console.error(`Failed to fetch user for alias: ${alias}`, err);
            return null;
          });

          if (!user) {
            console.warn(
              `Skipping status due to invalid or missing user: ${alias}`
            );
            return null; // Skip invalid statuses
          }

          try {
            const status = new Status(
              item.post?.S || "No content",
              user,
              parseInt(item.timestamp?.N || "0")
            );
            console.log(
              `Successfully created Status for alias: ${alias}`,
              status
            );
            return status;
          } catch (error) {
            console.error(`Error creating Status for alias: ${alias}`, error);
            return null;
          }
        })
      );

      const validStatuses = statuses.filter(
        (status): status is Status => status !== null
      );

      return { statuses: validStatuses, lastKey: data.LastEvaluatedKey };
    } catch (error) {
      console.error(`Error getting statuses for user ${userAlias}:`, error);
      throw new Error("Error fetching statuses.");
    }
  }

  async deleteStatus(userAlias: string, timestamp: number): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        alias: { S: userAlias },
        timestamp: { N: timestamp.toString() },
      },
    };

    try {
      await this.client.send(new DeleteItemCommand(params));
      console.log(
        `Status for user ${userAlias} with timestamp ${timestamp} deleted successfully!`
      );
    } catch (error) {
      console.error(`Error deleting status for user ${userAlias}:`, error);
      throw error;
    }
  }
}

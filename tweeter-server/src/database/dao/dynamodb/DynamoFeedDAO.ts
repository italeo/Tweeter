import {
  BatchWriteItemCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import { FeedDAO } from "../interfaces/FeedDAO";
import { Status } from "tweeter-shared";
import { DynamoBaseDAO } from "./DynamoBaseDAO";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { User } from "tweeter-shared"; // Assuming you have a User class to handle user details

export class DynamoFeedDAO extends DynamoBaseDAO implements FeedDAO {
  private readonly tableName: string = "Feed";
  private readonly sqsClient: SQSClient;
  private readonly batchProcessingQueueUrl: string =
    "https://sqs.us-west-2.amazonaws.com/506149017946/BatchProcessingQueue";

  public constructor() {
    super();
    this.sqsClient = new SQSClient({});
  }

  // Add a status to the feed of all followers using SQS
  async addStatusToFeed(
    followerAliases: string[],
    status: Status
  ): Promise<void> {
    if (followerAliases.length === 0) {
      console.log("No followers to update feeds for. Skipping SQS message.");
      return;
    }

    try {
      // Split followers into manageable batches (to handle SQS limits)
      const batches = this.splitIntoBatches(followerAliases, 25);

      for (const batch of batches) {
        const message = {
          followers: batch,
          status: {
            authorAlias: status.user.alias,
            timestamp: status.timestamp,
            post: status.post,
          },
        };

        const sqsParams = {
          QueueUrl: this.batchProcessingQueueUrl,
          MessageBody: JSON.stringify(message),
        };

        await this.sqsClient.send(new SendMessageCommand(sqsParams));
        console.log(
          `Batch of ${batch.length} followers sent to Batch Processing Queue.`
        );
      }
    } catch (error) {
      console.error(`Error adding status to Batch Processing Queue:`, error);
      throw error;
    }
  }

  // Split array into batches of specified size
  private splitIntoBatches(array: string[], batchSize: number): string[][] {
    const result: string[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      result.push(array.slice(i, i + batchSize));
    }
    return result;
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
      console.log("DynamoDB Query Input for Feed:", params);
      const data = await this.client.send(new QueryCommand(params));

      const feedItems = data.Items || [];
      const authorAliases = [
        ...new Set(feedItems.map((item) => item.authorAlias?.S)),
      ].filter((alias): alias is string => !!alias);

      const userMap = await this.batchFetchUserDetails(authorAliases);

      const statuses = feedItems
        .map((item) => {
          const userDetails = userMap.get(item.authorAlias?.S || "");
          if (!userDetails) {
            console.error("User details not found:", item.authorAlias?.S);
            return null;
          }

          // Map userDetails to User
          const user = new User(
            userDetails.firstName,
            userDetails.lastName,
            userDetails.alias,
            userDetails.imageUrl,
            ""
          );

          return new Status(
            item.post?.S || "",
            user,
            parseInt(item.timestamp?.N || "0")
          );
        })
        .filter((status): status is Status => status !== null);

      return { statuses, hasMore: !!data.LastEvaluatedKey };
    } catch (error) {
      console.error(`Error retrieving feed for user ${userAlias}:`, error);
      throw error;
    }
  }
}

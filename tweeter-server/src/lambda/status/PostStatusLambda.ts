import { PostStatusRequest, PostStatusResponse } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService";
import { DynamoFeedDAO } from "../../database/dao/dynamodb/DynamoFeedDAO";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";
import { DynamoStatusDAO } from "../../database/dao/dynamodb/DynamoStatusDAO";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: "us-west-2" });
const FEED_UPDATE_QUEUE_URL =
  "https://sqs.us-west-2.amazonaws.com/506149017946/FeedUpdateQueue";

export const handler = async (
  request: PostStatusRequest
): Promise<PostStatusResponse> => {
  // Validate the request
  if (!request.token || !request.status) {
    console.error("Invalid request: Missing token or status.");
    return {
      success: false,
      message: "Invalid request. Missing token or status.",
    };
  }

  // Instantiate DAOs and Service
  const statusDAO = new DynamoStatusDAO();
  const feedDAO = new DynamoFeedDAO();
  const followDAO = new DynamoFollowDAO();
  const statusService = new StatusService(statusDAO, feedDAO, followDAO);

  try {
    // Step 1: Post the status
    await statusService.postStatus(request.token, request.status);
    console.log(
      `Status posted successfully for user: ${request.status.user.alias}`
    );

    // Step 2: Send feed update message to SQS
    const messageBody = {
      token: request.token,
      status: request.status,
    };

    const sqsParams = {
      QueueUrl: FEED_UPDATE_QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
    };

    let retries = 0;
    const maxRetries = 3;
    const delay = (retryCount: number) =>
      new Promise((res) => setTimeout(res, Math.pow(2, retryCount) * 100));

    while (retries < maxRetries) {
      try {
        await sqsClient.send(new SendMessageCommand(sqsParams));
        console.log(
          `Feed update queued successfully for user: ${request.status.user.alias}`
        );
        break;
      } catch (error) {
        retries++;
        console.error(
          `Failed to enqueue feed update. Attempt ${retries}/${maxRetries}:`,
          error
        );
        if (retries === maxRetries) {
          throw new Error(
            `Failed to enqueue feed update after ${maxRetries} attempts.`
          );
        }
        await delay(retries);
      }
    }

    return {
      success: true,
      message: "Status posted successfully and feed update queued.",
    };
  } catch (error) {
    console.error("Error in handler:", error);
    return {
      success: false,
      message: "Failed to post status and queue feed update.",
    };
  }
};

import { PostStatusRequest, PostStatusResponse } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService";
import { DynamoFeedDAO } from "../../database/dao/dynamodb/DynamoFeedDAO";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";
import { DynamoStatusDAO } from "../../database/dao/dynamodb/DynamoStatusDAO";

export const handler = async (
  request: PostStatusRequest
): Promise<PostStatusResponse> => {
  // Instantiate the DAOs
  const statusDAO = new DynamoStatusDAO();
  const feedDAO = new DynamoFeedDAO();
  const followDAO = new DynamoFollowDAO();

  // Inject the DAOs into the StatusService
  const statusService = new StatusService(statusDAO, feedDAO, followDAO);

  await statusService.postStatus(request.token, request.status);
  return {
    success: true,
    message: null,
  };
};

import { FollowRequest, FollowResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handleFollowAction } from "./FollowActionUtil";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";

export const handler = async (
  request: FollowRequest
): Promise<FollowResponse> => {
  // Instantiate the DAOs
  const followDAO = new DynamoFollowDAO();

  // Inject the DAOs into the FollowService
  const followService = new FollowService(followDAO);

  return handleFollowAction(() =>
    followService.follow(request.token, request.userToFollow)
  );
};

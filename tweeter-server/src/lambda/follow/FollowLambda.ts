import { FollowRequest, FollowResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handleFollowAction } from "./FollowActionUtil";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";

export const handler = async (
  request: FollowRequest
): Promise<FollowResponse> => {
  // Instantiate the DAO
  const followDAO = new DynamoFollowDAO();
  const followService = new FollowService(followDAO);

  // Use the 'followerAlias' directly from the request
  return handleFollowAction(() =>
    followService.follow(request.followerAlias, request.userToFollow)
  );
};

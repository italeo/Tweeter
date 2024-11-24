import { UnfollowRequest, UnfollowResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handleFollowAction } from "./FollowActionUtil";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";

export const handler = async (
  request: UnfollowRequest
): Promise<UnfollowResponse> => {
  // Instantiate the DAOs
  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO);
  const followDAO = new DynamoFollowDAO();

  // Inject the DAOs into the FollowService
  const followService = new FollowService(followDAO, userDAO);

  return handleFollowAction(() =>
    followService.unfollow(request.token, request.userToUnfollow)
  );
};

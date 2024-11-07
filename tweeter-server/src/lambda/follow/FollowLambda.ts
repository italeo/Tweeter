import { FollowRequest, FollowResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handleFollowAction } from "./FollowActionUtil";

export const handler = async (
  request: FollowRequest
): Promise<FollowResponse> => {
  const followService = new FollowService();

  return handleFollowAction(() =>
    followService.follow(request.token, request.userToFollow)
  );
};

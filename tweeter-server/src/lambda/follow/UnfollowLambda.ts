import { UnfollowRequest, UnfollowResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handleFollowAction } from "./FollowActionUtil";

export const handler = async (
  request: UnfollowRequest
): Promise<UnfollowResponse> => {
  const followService = new FollowService();

  return handleFollowAction(() =>
    followService.unfollow(request.token, request.userToUnfollow)
  );
};

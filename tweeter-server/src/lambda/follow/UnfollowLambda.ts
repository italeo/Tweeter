import { UnfollowRequest, UnfollowResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";

export const handler = async (
  request: UnfollowRequest
): Promise<UnfollowResponse> => {
  const followService = new FollowService();
  const [followerCount, followeeCount] = await followService.unfollow(
    request.token,
    request.userToUnfollow
  );
  return {
    success: true,
    message: null,
    followerCount: followerCount,
    followeeCount: followeeCount,
  };
};

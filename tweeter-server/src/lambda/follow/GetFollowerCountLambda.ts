import {
  GetFollowerCountRequest,
  GetFollowerCountResponse,
} from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";

export const handler = async (
  request: GetFollowerCountRequest
): Promise<GetFollowerCountResponse> => {
  const followService = new FollowService();

  const count = await followService.getFollowerCount(
    request.token,
    request.user
  );
  return {
    success: true,
    message: null,
    count: count,
  };
};

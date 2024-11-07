import {
  GetFollowerCountRequest,
  GetFollowerCountResponse,
} from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handleCountRequest } from "./FollowCountUtil";

export const handler = async (
  request: GetFollowerCountRequest
): Promise<GetFollowerCountResponse> => {
  const followService = new FollowService();

  return handleCountRequest(() =>
    followService.getFollowerCount(request.token, request.user)
  );
};

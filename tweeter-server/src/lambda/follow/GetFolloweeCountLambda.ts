import {
  GetFolloweeCountRequest,
  GetFolloweeCountResponse,
} from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handleCountRequest } from "./FollowCountUtil";

export const handler = async (
  request: GetFolloweeCountRequest
): Promise<GetFolloweeCountResponse> => {
  const followService = new FollowService();

  return handleCountRequest(() =>
    followService.getFolloweeCount(request.token, request.user)
  );
};

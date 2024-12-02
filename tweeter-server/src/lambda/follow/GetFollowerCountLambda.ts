import {
  GetFollowerCountRequest,
  GetFollowerCountResponse,
} from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handleCountRequest } from "./FollowCountUtil";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";

export const handler = async (
  request: GetFollowerCountRequest
): Promise<GetFollowerCountResponse> => {
  const followDAO = new DynamoFollowDAO();

  const followService = new FollowService(followDAO);

  return handleCountRequest(() => followService.getFollowerCount(request.user));
};

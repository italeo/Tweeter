import {
  GetFolloweeCountRequest,
  GetFolloweeCountResponse,
} from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handleCountRequest } from "./FollowCountUtil";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";

export const handler = async (
  request: GetFolloweeCountRequest
): Promise<GetFolloweeCountResponse> => {
  const followDAO = new DynamoFollowDAO();
  const followService = new FollowService(followDAO);

  return handleCountRequest(() => followService.getFolloweeCount(request.user));
};

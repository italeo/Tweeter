import { PagedUserItemRequest, PagedUserItemResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handlePagedUserRequest } from "./FollowLambdaUtils";

export const handler = async (
  request: PagedUserItemRequest
): Promise<PagedUserItemResponse> => {
  const followService = new FollowService();
  return handlePagedUserRequest(() =>
    followService.loadMoreFollowers(
      request.token,
      request.userAlias,
      request.pageSize,
      request.lastItem
    )
  );
};

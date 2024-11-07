import { PagedUserItemRequest, PagedUserItemResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handlePagedUserRequest } from "./FollowLambdaUtils";

// Function that will be called by API Gateway when user makes a 'request' to get more followees
export const handler = async (
  request: PagedUserItemRequest
): Promise<PagedUserItemResponse> => {
  const followService = new FollowService();
  return handlePagedUserRequest(() =>
    followService.loadMoreFollowees(
      request.token,
      request.userAlias,
      request.pageSize,
      request.lastItem
    )
  );
};

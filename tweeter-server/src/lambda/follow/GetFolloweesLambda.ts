import { PagedUserItemRequest, PagedUserItemResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handlePagedUserRequest } from "./PagedFollowUtil";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";

// Function that will be called by API Gateway when user makes a 'request' to get more followees
export const handler = async (
  request: PagedUserItemRequest
): Promise<PagedUserItemResponse> => {
  const followDAO = new DynamoFollowDAO();

  const followService = new FollowService(followDAO);

  return handlePagedUserRequest(() =>
    followService.loadMoreFollowees(
      request.userAlias,
      request.pageSize,
      request.lastItem
    )
  );
};

import { PagedUserItemRequest, PagedUserItemResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handlePagedUserRequest } from "./PagedFollowUtil";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";

export const handler = async (
  request: PagedUserItemRequest
): Promise<PagedUserItemResponse> => {
  const followDAO = new DynamoFollowDAO();

  const followService = new FollowService(followDAO);

  return handlePagedUserRequest(() =>
    followService.loadMoreFollowers(
      request.userAlias,
      request.pageSize,
      request.lastItem
    )
  );
};

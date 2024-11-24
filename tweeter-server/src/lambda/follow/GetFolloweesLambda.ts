import { PagedUserItemRequest, PagedUserItemResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { handlePagedUserRequest } from "./PagedFollowUtil";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";

// Function that will be called by API Gateway when user makes a 'request' to get more followees
export const handler = async (
  request: PagedUserItemRequest
): Promise<PagedUserItemResponse> => {
  // Instantiate the required DAOs
  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO);
  const followDAO = new DynamoFollowDAO();

  // Inject DAOs into the service
  const followService = new FollowService(followDAO, userDAO);

  return handlePagedUserRequest(() =>
    followService.loadMoreFollowees(
      request.token,
      request.userAlias,
      request.pageSize,
      request.lastItem
    )
  );
};

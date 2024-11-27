import {
  PagedStatusItemRequest,
  PagedStatusItemResponse,
  StatusDto,
} from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService";
import { handlePagedStatusRequest } from "./PagedStatusUtil";
import { DynamoFeedDAO } from "../../database/dao/dynamodb/DynamoFeedDAO";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";
import { DynamoStatusDAO } from "../../database/dao/dynamodb/DynamoStatusDAO";

export const handler = async (
  request: PagedStatusItemRequest
): Promise<PagedStatusItemResponse> => {
  // Instantiate the DAOs
  const statusDAO = new DynamoStatusDAO();
  const feedDAO = new DynamoFeedDAO();
  const followDAO = new DynamoFollowDAO();

  // Inject the DAOs into the StatusService
  const statusService = new StatusService(statusDAO, feedDAO, followDAO);

  return handlePagedStatusRequest(
    async (
      token: string,
      userAlias: string,
      pageSize: number,
      lastItem: StatusDto | null
    ) => {
      // Strip `@` prefix from the alias for database queries
      const aliasWithoutPrefix = userAlias.startsWith("@")
        ? userAlias.substring(1)
        : userAlias;

      // Call the `loadMoreFeedItems` method with the updated alias
      return statusService.loadMoreFeedItems(
        token,
        aliasWithoutPrefix,
        pageSize,
        lastItem
      );
    },
    request
  );
};

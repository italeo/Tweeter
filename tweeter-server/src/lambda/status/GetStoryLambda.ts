import {
  PagedStatusItemRequest,
  PagedStatusItemResponse,
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
    statusService.loadMoreStoryItems.bind(statusService),
    request
  );
};

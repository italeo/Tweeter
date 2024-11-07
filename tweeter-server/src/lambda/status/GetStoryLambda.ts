import {
  PagedStatusItemRequest,
  PagedStatusItemResponse,
} from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService";
import { handlePagedStatusRequest } from "./PagedStatusUtil";

export const handler = async (
  request: PagedStatusItemRequest
): Promise<PagedStatusItemResponse> => {
  const statusService = new StatusService();
  return handlePagedStatusRequest(
    statusService.loadMoreStoryItems.bind(statusService),
    request
  );
};

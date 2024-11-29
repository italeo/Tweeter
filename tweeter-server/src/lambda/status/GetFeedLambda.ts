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
  try {
    // Log the incoming request
    console.log("Incoming request:", JSON.stringify(request, null, 2));

    // Validate the request object
    if (!request || typeof request !== "object") {
      throw new Error("Invalid request object.");
    }

    const { token, userAlias, pageSize, lastItem } = request;

    if (!token || typeof token !== "string") {
      throw new Error("Missing or invalid 'token'.");
    }

    if (!userAlias || typeof userAlias !== "string") {
      throw new Error("Missing or invalid 'userAlias'.");
    }

    if (!pageSize || typeof pageSize !== "number") {
      throw new Error("Missing or invalid 'pageSize'.");
    }

    // Log extracted values
    console.log("Extracted values:", { token, userAlias, pageSize, lastItem });

    // DAOs and service setup
    const statusDAO = new DynamoStatusDAO();
    const feedDAO = new DynamoFeedDAO();
    const followDAO = new DynamoFollowDAO();

    const statusService = new StatusService(statusDAO, feedDAO, followDAO);

    return handlePagedStatusRequest(
      async (
        token: string,
        userAlias: string,
        pageSize: number,
        lastItem: StatusDto | null
      ) => {
        // Normalize the alias
        const aliasWithoutPrefix = userAlias.startsWith("@")
          ? userAlias.substring(1).toLowerCase().trim()
          : userAlias.toLowerCase().trim();

        console.log("Normalized alias:", aliasWithoutPrefix);

        // Load feed items
        const feedItems = await statusService.loadMoreFeedItems(
          token,
          aliasWithoutPrefix,
          pageSize,
          lastItem
        );

        // Log the fetched feed items
        console.log("Fetched feed items:", feedItems);

        return feedItems;
      },
      request
    );
  } catch (error) {
    // Log the error for troubleshooting
    console.error("Error in GetFeedLambda handler:", error);

    // Rethrow the error to let Lambda's error handling manage it
    throw error;
  }
};

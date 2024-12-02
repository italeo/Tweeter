import {
  GetIsFollowerStatusRequest,
  GetIsFollowerStatusResponse,
} from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";

export const handler = async (
  request: GetIsFollowerStatusRequest
): Promise<GetIsFollowerStatusResponse> => {
  console.log("GetIsFollowerStatus Request:", JSON.stringify(request, null, 2));

  const followDAO = new DynamoFollowDAO();
  const followService = new FollowService(followDAO);

  try {
    const isFollower = await followService.getIsFollowerStatus(
      request.user,
      request.selectedUser
    );
    console.log("GetIsFollowerStatus Result:", isFollower);

    return {
      success: true,
      message: null,
      isFollower,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Log and return the error message
      console.error("Error in GetIsFollowerStatus handler:", error.message);
      return {
        success: false,
        message: error.message,
        isFollower: false,
      };
    } else {
      // Handle unexpected error types
      console.error(
        "Unexpected error type in GetIsFollowerStatus handler:",
        error
      );
      return {
        success: false,
        message: "An unexpected error occurred.",
        isFollower: false,
      };
    }
  }
};

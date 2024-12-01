import {
  GetIsFollowerStatusRequest,
  GetIsFollowerStatusResponse,
} from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
import { DynamoFollowDAO } from "../../database/dao/dynamodb/DynamoFollowDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";

export const handler = async (
  request: GetIsFollowerStatusRequest
): Promise<GetIsFollowerStatusResponse> => {
  console.log("GetIsFollowerStatus Request:", JSON.stringify(request, null, 2));

  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO);
  const followDAO = new DynamoFollowDAO();

  const followService = new FollowService(followDAO, userDAO);

  try {
    const isFollower = await followService.getIsFollowerStatus(
      request.token,
      request.user,
      request.selectedUser
    );
    console.log("GetIsFollowerStatus Result:", isFollower);

    return {
      success: true,
      message: null,
      isFollower: isFollower,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      // If it's an Error object, access its message property
      console.error("Error in GetIsFollowerStatus handler:", error.message);
      return {
        success: false,
        message: error.message,
        isFollower: false,
      };
    } else {
      // Handle non-Error types of errors (e.g., strings or custom types)
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

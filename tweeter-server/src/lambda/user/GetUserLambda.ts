import {
  AuthTokenDto,
  GetUserRequest,
  GetUserResponse,
  UserDto,
} from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoAuthTokenDAO } from "../../database/dao/dynamodb/DynamoAuthTokenDAO";

export const handler = async (
  request: GetUserRequest
): Promise<GetUserResponse> => {
  // Validate request fields
  if (!request.token || !request.alias) {
    return {
      success: false,
      message: "Token or alias is missing in the request.",
      user: {
        alias: "",
        firstName: "",
        lastName: "",
        imageUrl: "",
      },
    };
  }

  // Instantiate the required DAOs
  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO);
  const authTokenDAO = new DynamoAuthTokenDAO();

  // Inject DAOs into the service
  const userService = new UserService(userDAO, authTokenDAO, profileImageDAO);

  // Fetch the user data
  try {
    const userDto = await userService.getUser(request.token, request.alias);

    if (!userDto) {
      return {
        success: false,
        message: "User not found.",
        user: {
          alias: "",
          firstName: "",
          lastName: "",
          imageUrl: "",
        },
      };
    }

    return {
      success: true,
      message: null,
      user: userDto,
    };
  } catch (error) {
    console.error("Error fetching user:", error);

    return {
      success: false,
      message: "An error occurred while retrieving the user.",
      user: {
        alias: "",
        firstName: "",
        lastName: "",
        imageUrl: "",
      },
    };
  }
};

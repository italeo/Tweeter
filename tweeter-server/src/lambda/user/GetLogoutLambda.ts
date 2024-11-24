import { DynamoAuthTokenDAO } from "../../database/dao/dynamodb/DynamoAuthTokenDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";
import { UserService } from "../../model/service/UserService";
import { AuthToken, LogoutRequest, LogoutResponse } from "tweeter-shared";

export const handler = async (
  request: LogoutRequest
): Promise<LogoutResponse> => {
  // Instantiate the required DAOs
  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO); // Not used here, but required by the UserService constructor
  const authTokenDAO = new DynamoAuthTokenDAO();

  // Inject the DAOs into the UserService
  const userService = new UserService(userDAO, authTokenDAO);

  if (!request.token) {
    return {
      success: false,
      message: "Token is missing",
    };
  }

  const authToken = new AuthToken(request.token, Date.now());

  await userService.logout(authToken);

  return {
    success: true,
    message: "Logout successful",
  };
};

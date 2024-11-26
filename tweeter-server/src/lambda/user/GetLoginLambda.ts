import { LoginRequest, LoginResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { DynamoAuthTokenDAO } from "../../database/dao/dynamodb/DynamoAuthTokenDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";

export const handler = async (
  request: LoginRequest
): Promise<LoginResponse> => {
  // Instantiate the required DAOs
  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO);
  const authTokenDAO = new DynamoAuthTokenDAO();

  // Inject the DAOs into the UserService
  const userService = new UserService(userDAO, authTokenDAO, profileImageDAO);

  const [user, authToken] = await userService.login(
    request.alias,
    request.password
  );

  return {
    success: true,
    message: null,
    user: user,
    authToken: authToken,
  };
};

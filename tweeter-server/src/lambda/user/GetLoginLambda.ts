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

  try {
    // Strip `@` from alias before logging in
    const aliasWithoutPrefix = request.alias.startsWith("@")
      ? request.alias.substring(1)
      : request.alias;

    // Perform login
    const [user, authToken] = await userService.login(
      aliasWithoutPrefix,
      request.password
    );

    // Add `@` back for the response
    const userWithAtPrefix = {
      ...user,
      alias: `@${aliasWithoutPrefix}`,
    };

    return {
      success: true,
      message: null,
      user: userWithAtPrefix,
      authToken: authToken,
    };
  } catch (error) {
    console.error("Error during login:", error);
    return {
      success: false,
      message: "Login failed. Please check your alias or password.",
      user: { alias: "", firstName: "", lastName: "", imageUrl: "" },
      authToken: { token: "", timestamp: 0 },
    };
  }
};

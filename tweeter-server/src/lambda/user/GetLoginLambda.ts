import { LoginRequest, LoginResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { DynamoAuthTokenDAO } from "../../database/dao/dynamodb/DynamoAuthTokenDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";

export const handler = async (
  request: LoginRequest
): Promise<LoginResponse> => {
  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO);
  const authTokenDAO = new DynamoAuthTokenDAO();

  const userService = new UserService(userDAO, authTokenDAO, profileImageDAO);

  try {
    // Ensure alias has `@` prefix before login
    const aliasWithPrefix = request.alias.startsWith("@")
      ? request.alias
      : `@${request.alias}`;

    console.log(`Attempting login for alias: ${aliasWithPrefix}`);

    // Perform login
    const [user, authToken] = await userService.login(
      aliasWithPrefix,
      request.password
    );

    console.log(`Login successful for alias: ${aliasWithPrefix}`);
    return {
      success: true,
      message: null,
      user: user,
      authToken: authToken,
    };
  } catch (error) {
    console.error(`Login failed for alias: ${request.alias}`, error);

    return {
      success: false,
      message: "Login failed. Please check your alias or password.",
      user: { alias: "", firstName: "", lastName: "", imageUrl: "" },
      authToken: { token: "", timestamp: 0 },
    };
  }
};

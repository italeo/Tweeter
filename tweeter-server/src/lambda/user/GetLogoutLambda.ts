import { UserService } from "../../model/service/UserService";
import { AuthToken, LogoutRequest, LogoutResponse } from "tweeter-shared";

export const handler = async (
  request: LogoutRequest
): Promise<LogoutResponse> => {
  const userService = new UserService();

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

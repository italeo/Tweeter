import { RegisterRequest, RegisterResponse, User } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoAuthTokenDAO } from "../../database/dao/dynamodb/DynamoAuthTokenDAO";
import { Buffer } from "buffer";

export const handler = async (
  request: RegisterRequest
): Promise<RegisterResponse> => {
  console.log("Received payload:", {
    firstName: request.firstName,
    lastName: request.lastName,
    alias: request.alias,
    password: "REDACTED",
    userImageBase64Length: request.userImageBase64?.length || 0,
    imageFileExtension: request.imageFileExtension,
  });

  if (
    !request.firstName ||
    !request.lastName ||
    !request.alias ||
    !request.password ||
    !request.userImageBase64 ||
    !request.imageFileExtension
  ) {
    console.error("Missing required fields in the registration request.");
    return {
      success: false,
      message: "Missing required fields.",
      user: {
        alias: "",
        firstName: "",
        lastName: "",
        imageUrl: "",
      },
      authToken: {
        token: "",
        timestamp: 0,
      },
    };
  }

  let userImageBytes: Buffer;
  try {
    userImageBytes = Buffer.from(request.userImageBase64, "base64");
  } catch (error) {
    console.error("Failed to decode image:", error);
    return {
      success: false,
      message: "Invalid user image.",
      user: { alias: "", firstName: "", lastName: "", imageUrl: "" },
      authToken: { token: "", timestamp: 0 },
    };
  }

  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO);
  const authTokenDAO = new DynamoAuthTokenDAO();

  const userService = new UserService(userDAO, authTokenDAO, profileImageDAO);

  try {
    // Strip `@` before passing to the service
    const aliasWithoutPrefix = request.alias.startsWith("@")
      ? request.alias.substring(1)
      : request.alias;

    const [user, authToken] = await userService.register(
      request.firstName,
      request.lastName,
      aliasWithoutPrefix,
      request.password,
      userImageBytes,
      request.imageFileExtension
    );

    // Add `@` back for the response by creating a new User object
    const userWithAtPrefix = {
      firstName: user.firstName,
      lastName: user.lastName,
      alias: `@${aliasWithoutPrefix}`,
      imageUrl: user.imageUrl,
    };

    // Use this object in your response instead of a full `User` object.
    return {
      success: true,
      message: null,
      user: userWithAtPrefix,
      authToken: authToken,
    };
  } catch (error) {
    console.error("Error during registration:", error);
    return {
      success: false,
      message: "Registration failed.",
      user: { alias: "", firstName: "", lastName: "", imageUrl: "" },
      authToken: { token: "", timestamp: 0 },
    };
  }
};

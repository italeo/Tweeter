import { RegisterRequest, RegisterResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoAuthTokenDAO } from "../../database/dao/dynamodb/DynamoAuthTokenDAO";
import { Buffer } from "buffer";

export const handler = async (
  request: RegisterRequest
): Promise<RegisterResponse> => {
  // Validate request fields
  if (
    !request.firstName ||
    !request.lastName ||
    !request.alias ||
    !request.password ||
    !request.userImageBase64 ||
    !request.imageFileExtension
  ) {
    console.error(
      "Missing required fields in the registration request:",
      request
    );
    return {
      success: false,
      message: "Missing required fields in the registration request.",
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

  // Convert Base64 image to Buffer
  let userImageBytes: Buffer;
  try {
    userImageBytes = Buffer.from(request.userImageBase64, "base64");
  } catch (error) {
    console.error("Failed to convert userImageBase64 to bytes:", error);
    return {
      success: false,
      message: "Invalid user image data. Please try again.",
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

  // Instantiate DAOs
  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO);
  const authTokenDAO = new DynamoAuthTokenDAO();

  // Inject the DAOs into the UserService
  const userService = new UserService(userDAO, authTokenDAO, profileImageDAO);

  // Handle registration logic
  try {
    const [user, authToken] = await userService.register(
      request.firstName,
      request.lastName,
      request.alias,
      request.password,
      userImageBytes,
      request.imageFileExtension
    );

    // Return success response
    return {
      success: true,
      message: null,
      user: user,
      authToken: authToken,
    };
  } catch (error) {
    console.error("Error during user registration:", error);

    // Return error response
    return {
      success: false,
      message: "An error occurred during registration. Please try again.",
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
};

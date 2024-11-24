import { RegisterRequest, RegisterResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";
import { DynamoUserDAO } from "../../database/dao/dynamodb/DynamoUserDAO";
import { DynamoAuthTokenDAO } from "../../database/dao/dynamodb/DynamoAuthTokenDAO";

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

  // Convert base64 image to bytes
  const userImageBytes = Buffer.from(request.userImageBase64, "base64");

  // Instantiate the required DAOs
  const profileImageDAO = new DynamoS3ProfileImageDAO();
  const userDAO = new DynamoUserDAO(profileImageDAO);
  const authTokenDAO = new DynamoAuthTokenDAO();

  // Inject the DAOs into the UserService
  const userService = new UserService(userDAO, authTokenDAO);

  // Handle the registration logic
  try {
    const [user, authToken] = await userService.register(
      request.firstName,
      request.lastName,
      request.alias,
      request.password,
      userImageBytes,
      request.imageFileExtension
    );

    // Return a success response
    return {
      success: true,
      message: null,
      user: user,
      authToken: authToken,
    };
  } catch (error) {
    console.error("Error during user registration:", error);

    // Return an error response
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

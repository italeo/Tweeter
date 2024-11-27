import { Buffer } from "buffer";
import {
  AuthToken,
  FakeData,
  AuthTokenDto,
  UserDto,
  GetUserRequest,
  User,
} from "tweeter-shared";
import { AuthTokenDAO } from "../../database/dao/interfaces/AuthTokenDAO";
import { UserDAO } from "../../database/dao/interfaces/UserDAO";
import bcrypt from "bcryptjs";
import { DynamoS3ProfileImageDAO } from "../../database/dao/s3/DynamoS3ProfileImageDAO";

export class UserService {
  private userDAO: UserDAO;
  private authTokenDAO: AuthTokenDAO;
  private profileImageDAO: DynamoS3ProfileImageDAO;

  // Inject DAOs into the service
  public constructor(
    userDAO: UserDAO,
    authTokenDAO: AuthTokenDAO,
    profileImageDAO: DynamoS3ProfileImageDAO
  ) {
    this.userDAO = userDAO;
    this.authTokenDAO = authTokenDAO;
    this.profileImageDAO = profileImageDAO;
  }

  public async login(
    alias: string,
    password: string
  ): Promise<[UserDto, AuthTokenDto]> {
    console.log(`Attempting login for alias: ${alias}`);
    const user = await this.userDAO.getUserByAlias(alias);
    if (!user) {
      console.error(`User not found for alias: ${alias}`);
      throw new Error("Invalid alias or password");
    }

    const hashedPassword = await this.userDAO.getPasswordHash(alias);
    console.log(`Hashed password retrieved for alias: ${alias}`);

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
      console.error(`Invalid password for alias: ${alias}`);
      throw new Error("Invalid alias or password");
    }

    const authToken = AuthToken.Generate();
    console.log(`Generated token for alias: ${alias}: ${authToken.token}`);

    await this.authTokenDAO.storeToken(authToken);

    return [user.toDto(), authToken.toDto()];
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: Uint8Array,
    imageFileExtension: string
  ): Promise<[UserDto, AuthTokenDto]> {
    console.log("Starting user registration...");

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully.");

    const imageBuffer = Buffer.from(userImageBytes);

    // Upload profile image to S3
    const imageUrl = await this.profileImageDAO.uploadProfileImage(
      alias,
      imageBuffer,
      imageFileExtension
    );
    console.log(`Profile image uploaded to: ${imageUrl}`);

    const newUser = new User(
      firstName,
      lastName,
      alias,
      imageUrl,
      hashedPassword
    );

    try {
      await this.userDAO.createUserWithPassword(newUser, hashedPassword);
      console.log("User created successfully in the database.");
    } catch (err) {
      console.error("Error creating new user:", err);
      throw new Error("Error creating new user.");
    }

    const authToken = AuthToken.Generate();
    console.log(`Generated AuthToken: ${authToken.token}`);

    try {
      await this.authTokenDAO.createAuthToken(authToken); // Log specific error from here
      console.log("AuthToken stored successfully.");
    } catch (err) {
      console.error("Error storing authentication token:", err);
      throw new Error("Error storing authentication token.");
    }

    return [newUser.toDto(), authToken.toDto()];
  }

  public async getUser(token: string, alias: string): Promise<UserDto | null> {
    const authToken = await this.authTokenDAO.getAuthToken(token);
    if (!authToken) {
      throw new Error("Invalid or expired authentication token.");
    }

    const user = await this.userDAO.getUserByAlias(alias);
    if (!user) {
      throw new Error("User not found.");
    }

    return user.toDto();
  }

  public async logout(authToken: AuthToken): Promise<void> {
    // Pause so we can see the logging out message. Delete when the call to the server is implemented.
    // await new Promise((res) => setTimeout(res, 1000));
    try {
      await this.authTokenDAO.deleteAuthToken(authToken.token);
    } catch (err) {
      throw new Error(
        "Error during logout. Unable to delete authentication token."
      );
    }
  }
}

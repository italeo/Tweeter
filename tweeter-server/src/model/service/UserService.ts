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

export class UserService {
  private userDAO: UserDAO;
  private authTokenDAO: AuthTokenDAO;

  // Inject DAOs into the service
  public constructor(userDAO: UserDAO, authTokenDAO: AuthTokenDAO) {
    this.userDAO = userDAO;
    this.authTokenDAO = authTokenDAO;
  }

  public async login(
    alias: string,
    password: string
  ): Promise<[UserDto, AuthTokenDto]> {
    // TODO: Replace with the result of calling the server
    // const user = FakeData.instance.firstUser;

    const user = await this.userDAO.getUserByAlias(alias);
    if (!user) {
      throw new Error("Invalid alias or password");
    }

    const hashedPassword = await this.userDAO.getPasswordHash(alias);

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
      throw new Error("Invalid alias or password");
    }

    // Generate and store a new authentication token
    const authToken = AuthToken.Generate();
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
    // Not neded now, but will be needed when you make the request to the server in milestone 3
    const imageStringBase64: string =
      Buffer.from(userImageBytes).toString("base64");
    const hashedPassword = await bcrypt.hash(password, 10);

    // const user = FakeData.instance.firstUser;

    const newUser = new User(
      firstName,
      lastName,
      alias,
      "imageUrlPlaceholder",
      hashedPassword
    );

    try {
      await this.userDAO.createUser(newUser);
    } catch (err) {
      throw new Error("Error creating new user.");
    }

    const authToken = AuthToken.Generate();
    try {
      await this.authTokenDAO.createAuthToken(authToken);
    } catch (err) {
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

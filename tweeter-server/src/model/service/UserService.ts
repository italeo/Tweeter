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

    // const user = FakeData.instance.firstUser;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User(firstName, lastName, alias, "imageUrlPlaceholder");
    newUser.password = hashedPassword;

    await this.userDAO.createUser(newUser);

    const authToken = AuthToken.Generate();
    await this.authTokenDAO.createAuthToken(authToken);

    return [newUser.toDto(), authToken.toDto()];
  }

  public async getUser(token: string, alias: string): Promise<UserDto | null> {
    const request: GetUserRequest = {
      token: token,
      alias: alias,
    };

    const user = FakeData.instance.findUserByAlias(alias);
    return user ? user.toDto() : null;
  }

  public async logout(authToken: AuthToken): Promise<void> {
    // Pause so we can see the logging out message. Delete when the call to the server is implemented.
    await new Promise((res) => setTimeout(res, 1000));
  }
}

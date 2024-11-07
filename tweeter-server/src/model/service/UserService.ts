import { Buffer } from "buffer";
import {
  AuthToken,
  FakeData,
  AuthTokenDto,
  UserDto,
  GetUserRequest,
} from "tweeter-shared";

export class UserService {
  public async login(
    alias: string,
    password: string
  ): Promise<[UserDto, AuthTokenDto]> {
    // TODO: Replace with the result of calling the server
    const user = FakeData.instance.firstUser;

    if (user === null) {
      throw new Error("Invalid alias or password");
    }

    return [user.toDto(), FakeData.instance.authToken.toDto()];
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

    const user = FakeData.instance.firstUser;

    if (user === null) {
      throw new Error("Invalid registration");
    }

    return [user.toDto(), FakeData.instance.authToken.toDto()];
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

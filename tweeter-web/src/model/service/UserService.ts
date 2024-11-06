import { Buffer } from "buffer";
import { User, AuthToken, FakeData } from "tweeter-shared";
import { ServerFacade } from "../network/ServerFacade";

export class UserService {
  private serverFacade = ServerFacade.getInstance();
  public async login(
    alias: string,
    password: string
  ): Promise<[User, AuthToken]> {
    const request = {
      alias,
      password,
    };

    return await this.serverFacade.login(request);
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: Uint8Array,
    imageFileExtension: string
  ): Promise<[User, AuthToken]> {
    // Not neded now, but will be needed when you make the request to the server in milestone 3
    const imageStringBase64: string =
      Buffer.from(userImageBytes).toString("base64");

    const request = {
      firstName,
      lastName,
      alias,
      password,
      userImageBase64: imageStringBase64,
      imageFileExtension,
    };

    return await this.serverFacade.register(request);
  }

  public async getUser(
    authToken: AuthToken,
    alias: string
  ): Promise<User | null> {
    return await this.serverFacade.getUser(authToken, alias);
  }

  public async logout(authToken: AuthToken): Promise<void> {
    await this.serverFacade.logout(authToken);
  }
}

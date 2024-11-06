import { Buffer } from "buffer";
import { User, AuthToken, FakeData } from "tweeter-shared";
import { ServerFacade } from "../network/ServerFacade";

export class UserService {
  private serverFacade = ServerFacade.getInstance();
  public async login(
    alias: string,
    password: string
  ): Promise<[User, AuthToken]> {
    // TODO: Replace with the result of calling the server
    const user = FakeData.instance.firstUser;

    if (user === null) {
      throw new Error("Invalid alias or password");
    }

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
    // TODO: Replace with the result of calling server
    return FakeData.instance.findUserByAlias(alias);
  }

  public async logout(authToken: AuthToken): Promise<void> {
    await this.serverFacade.logout(authToken);
    //console.log("Logout successful");
    //await new Promise((res) => setTimeout(res, 1000));
  }
}

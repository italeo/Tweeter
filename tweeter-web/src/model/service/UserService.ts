import { Buffer } from "buffer";
import { User, AuthToken } from "tweeter-shared";
import { ServerFacade } from "../network/ServerFacade";

export class UserService {
  private serverFacade = ServerFacade.getInstance();

  public async login(
    alias: string,
    password: string
  ): Promise<[User, AuthToken]> {
    const response = await this.serverFacade.login(alias, password);

    if (!response || !response[0] || !response[1]) {
      throw new Error("Login failed: Invalid response from server.");
    }

    return response;
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: Uint8Array,
    imageFileExtension: string
  ): Promise<[User, AuthToken]> {
    const imageStringBase64 = Buffer.from(userImageBytes).toString("base64");

    const response = await this.serverFacade.register(
      firstName,
      lastName,
      alias,
      password,
      imageStringBase64,
      imageFileExtension
    );

    if (!response || !response[0] || !response[1]) {
      throw new Error("Registration failed: Invalid response from server.");
    }

    return response;
  }

  public async getUser(authToken: AuthToken, alias: string): Promise<User> {
    // Clean the alias
    alias = this.cleanAlias(alias);

    // Validate the alias
    if (!/^@[a-zA-Z0-9_]+$/.test(alias)) {
      throw new Error(
        "Invalid alias format: aliases must start with @ and contain no punctuation."
      );
    }

    const user = await this.serverFacade.getUser(authToken, alias);

    if (!user) {
      throw new Error("Get user failed: User not found.");
    }

    return user;
  }

  public async logout(authToken: AuthToken): Promise<void> {
    await this.serverFacade.logout(authToken);
  }

  // Utility function to clean the alias
  private cleanAlias(alias: string): string {
    // Remove trailing punctuation (e.g., @bob, @bob.)
    return alias.replace(/[^\w@]+$/, "");
  }
}

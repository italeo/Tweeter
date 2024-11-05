import {
  AuthToken,
  AuthTokenDto,
  LoginRequest,
  LoginResponse,
  PagedStatusItemRequest,
  PagedStatusItemResponse,
  PagedUserItemRequest,
  PagedUserItemResponse,
  RegisterRequest,
  RegisterResponse,
  Status,
  StatusDto,
  User,
  UserDto,
} from "tweeter-shared";
import { ClientCommunicator } from "./ClientCommunicator";

export class ServerFacade {
  private static instance: ServerFacade;
  private SERVER_URL =
    "https://hhx5pg1c5c.execute-api.us-west-2.amazonaws.com/dev";
  private clientCommunicator: ClientCommunicator;

  private constructor() {
    this.clientCommunicator = new ClientCommunicator(this.SERVER_URL);
  }

  // Singleton access method
  public static getInstance(): ServerFacade {
    if (!ServerFacade.instance) {
      ServerFacade.instance = new ServerFacade();
    }
    return ServerFacade.instance;
  }

  public async getMoreFollowees(
    request: PagedUserItemRequest
  ): Promise<[User[], boolean]> {
    const response = await this.clientCommunicator.doPost<
      PagedUserItemRequest,
      PagedUserItemResponse
    >(request, "/followee/list");

    const items: User[] | null =
      response.success && response.items
        ? response.items.map((dto: UserDto) => User.fromDto(dto) as User)
        : null;

    if (response.success) {
      if (items === null) {
        throw new Error(`No followees found`);
      } else {
        return [items, response.hasMore];
      }
    } else {
      console.error(response);
      throw new Error(response.message || "An error occurred");
    }
  }

  public async getMoreFollowers(
    request: PagedUserItemRequest
  ): Promise<[User[], boolean]> {
    const response = await this.clientCommunicator.doPost<
      PagedUserItemRequest,
      PagedUserItemResponse
    >(request, "/follower/list");

    const items: User[] | null =
      response.success && response.items
        ? response.items.map((dto: UserDto) => User.fromDto(dto) as User)
        : null;

    if (response.success) {
      if (items === null) {
        throw new Error(`No followers found`);
      } else {
        return [items, response.hasMore];
      }
    } else {
      console.error(response);
      throw new Error(response.message || "An error occurred");
    }
  }

  public async getIsFollowerStatus(
    authToken: string,
    userId: string,
    selectedUserId: string
  ): Promise<boolean> {
    const response = await this.clientCommunicator.doPost<any, any>(
      { authToken, userId, selectedUserId },
      "/follower/status"
    );

    if (response.success) {
      return response.isFollower;
    } else {
      console.error(response);
      throw new Error(response.message || "An error occurred");
    }
  }

  public async getFolloweeCount(
    authToken: string,
    userId: string
  ): Promise<number> {
    const response = await this.clientCommunicator.doPost<any, any>(
      { authToken, userId },
      "/followee/count"
    );

    if (response.success) {
      return response.count;
    } else {
      console.error(response);
      throw new Error(response.message || "An error occurred");
    }
  }

  public async getFollowerCount(
    authToken: string,
    userId: string
  ): Promise<number> {
    const response = await this.clientCommunicator.doPost<any, any>(
      { authToken, userId },
      "/follower/count"
    );

    if (response.success) {
      return response.count;
    } else {
      console.error(response);
      throw new Error(response.message || "An error occurred");
    }
  }

  public async follow(
    authToken: string,
    userToFollowId: string
  ): Promise<[number, number]> {
    const response = await this.clientCommunicator.doPost<any, any>(
      { authToken, userToFollowId },
      "/follow"
    );

    if (response.success) {
      return [response.followerCount, response.followeeCount];
    } else {
      console.error(response);
      throw new Error(response.message || "An error occurred");
    }
  }

  public async unfollow(
    authToken: string,
    userToUnfollowId: string
  ): Promise<[number, number]> {
    const response = await this.clientCommunicator.doPost<any, any>(
      { authToken, userToUnfollowId },
      "/unfollow"
    );

    if (response.success) {
      return [response.followerCount, response.followeeCount];
    } else {
      console.error(response);
      throw new Error(response.message || "An error occurred");
    }
  }

  public async getMoreStoryItems(
    request: PagedStatusItemRequest
  ): Promise<[Status[], boolean]> {
    const response = await this.clientCommunicator.doPost<
      PagedStatusItemRequest,
      PagedStatusItemResponse
    >(request, "/story/list");

    const items: Status[] | null =
      response.success && response.items
        ? response.items.map((dto: StatusDto) => Status.fromDto(dto) as Status)
        : null;

    if (response.success) {
      if (items === null) {
        throw new Error(`No story items found`);
      } else {
        return [items, response.hasMore];
      }
    } else {
      console.error(response);
      throw new Error(response.message || "An error occurred");
    }
  }

  public async getMoreFeedItems(
    request: PagedStatusItemRequest
  ): Promise<[Status[], boolean]> {
    const response = await this.clientCommunicator.doPost<
      PagedStatusItemRequest,
      PagedStatusItemResponse
    >(request, "/feed/list"); // Update with the correct endpoint for feed items

    const items: Status[] | null =
      response.success && response.items
        ? response.items.map((dto: StatusDto) => Status.fromDto(dto) as Status)
        : null;

    if (response.success) {
      if (items === null) {
        throw new Error(`No feed items found`);
      } else {
        return [items, response.hasMore];
      }
    } else {
      console.error(response);
      throw new Error(response.message || "An error occurred");
    }
  }

  public async register(request: RegisterRequest): Promise<[User, AuthToken]> {
    try {
      const response = await this.clientCommunicator.doPost<
        RegisterRequest,
        RegisterResponse
      >(request, "/register");

      if (response.success) {
        const user = User.fromDto(response.user as UserDto);
        const authToken = AuthToken.fromDto(response.authToken as AuthTokenDto);
        return [user as User, authToken as AuthToken];
      } else {
        console.error("Register failed:", response);
        throw new Error(
          response.message || "An error occurred during registration"
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Client communicator POST failed:", error.message);
        throw new Error("Client communicator POST failed: " + error.message);
      } else {
        console.error(
          "Client communicator POST failed with unknown error:",
          error
        );
        throw new Error("Client communicator POST failed with unknown error");
      }
    }
  }

  public async login(request: LoginRequest): Promise<[User, AuthToken]> {
    try {
      const response = await this.clientCommunicator.doPost<
        LoginRequest,
        LoginResponse
      >(request, "/login");

      if (response.success) {
        const user = User.fromDto(response.user as UserDto);
        const authToken = AuthToken.fromDto(response.authToken as AuthTokenDto);
        return [user as User, authToken as AuthToken];
      } else {
        console.error("Login failed:", response);
        throw new Error(response.message || "An error occurred during login");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Client communicator POST failed:", error.message);
        throw new Error("Client communicator POST failed: " + error.message);
      } else {
        console.error(
          "Client communicator POST failed with unknown error:",
          error
        );
        throw new Error("Client communicator POST failed with unknown error");
      }
    }
  }
}

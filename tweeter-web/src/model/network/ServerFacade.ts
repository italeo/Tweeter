import {
  AuthToken,
  AuthTokenDto,
  FollowRequest,
  FollowResponse,
  GetFolloweeCountRequest,
  GetFolloweeCountResponse,
  GetFollowerCountRequest,
  GetFollowerCountResponse,
  GetIsFollowerStatusRequest,
  GetIsFollowerStatusResponse,
  GetUserRequest,
  GetUserResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  PagedStatusItemRequest,
  PagedStatusItemResponse,
  PagedUserItemRequest,
  PagedUserItemResponse,
  PostStatusRequest,
  PostStatusResponse,
  RegisterRequest,
  RegisterResponse,
  Status,
  StatusDto,
  UnfollowRequest,
  UnfollowResponse,
  User,
  UserDto,
} from "tweeter-shared";
import { ClientCommunicator } from "./ClientCommunicator";
import { Buffer } from "buffer";

export class ServerFacade {
  private static instance: ServerFacade;
  private SERVER_URL =
    "https://hhx5pg1c5c.execute-api.us-west-2.amazonaws.com/dev";
  private clientCommunicator: ClientCommunicator;

  private constructor() {
    this.clientCommunicator = new ClientCommunicator(this.SERVER_URL);
  }

  public static getInstance(): ServerFacade {
    if (!ServerFacade.instance) {
      ServerFacade.instance = new ServerFacade();
    }
    return ServerFacade.instance;
  }

  //
  // Follow calls
  //
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
    token: string,
    user: UserDto,
    selectedUser: UserDto
  ): Promise<boolean> {
    const request = {
      token: token,
      user: user,
      selectedUser: selectedUser,
    };

    try {
      const response = await this.clientCommunicator.doPost<
        GetIsFollowerStatusRequest,
        GetIsFollowerStatusResponse
      >(request, "/follower/status");

      if (response.success) {
        return response.isFollower;
      } else {
        console.error("GetIsFollowerStatus failed:", response);
        throw new Error(
          response.message || "An error occurred while checking follower status"
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

  public async getFolloweeCount(token: string, user: UserDto): Promise<number> {
    const request = { token, user };

    try {
      const response = await this.clientCommunicator.doPost<
        GetFolloweeCountRequest,
        GetFolloweeCountResponse
      >(request, "/followee/count");

      if (response.success) {
        return response.count;
      } else {
        console.error("GetFolloweeCount failed:", response);
        throw new Error(
          response.message || "An error occurred while fetching followee count"
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

  public async getFollowerCount(token: string, user: UserDto): Promise<number> {
    const request = { token, user };

    try {
      const response = await this.clientCommunicator.doPost<
        GetFollowerCountRequest,
        GetFollowerCountResponse
      >(request, "/follower/count");

      if (response.success) {
        return response.count;
      } else {
        console.error("GetFollowerCount failed:", response);
        throw new Error(
          response.message || "An error occurred while fetching follower count"
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

  public async follow(
    token: string,
    userToFollow: UserDto
  ): Promise<[number, number]> {
    const request = { token, userToFollow };

    try {
      const response = await this.clientCommunicator.doPost<
        FollowRequest,
        FollowResponse
      >(request, "/follow");

      if (response.success) {
        return [response.followerCount, response.followeeCount];
      } else {
        console.error("Follow failed:", response);
        throw new Error(
          response.message || "An error occurred while following"
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

  public async unfollow(
    token: string,
    userToUnfollow: UserDto
  ): Promise<[number, number]> {
    const request: UnfollowRequest = { token, userToUnfollow };

    try {
      const response = await this.clientCommunicator.doPost<
        UnfollowRequest,
        UnfollowResponse
      >(request, "/unfollow");

      if (response.success) {
        return [response.followerCount, response.followeeCount];
      } else {
        console.error("Unfollow failed:", response);
        throw new Error(
          response.message || "An error occurred while unfollowing"
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

  //
  // Status calls
  //
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
    >(request, "/feed/list");

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

  public async postStatus(token: string, status: StatusDto): Promise<void> {
    const request: PostStatusRequest = {
      token: token,
      status: status,
    };

    try {
      const response = await this.clientCommunicator.doPost<
        PostStatusRequest,
        PostStatusResponse
      >(request, "/poststatus");

      if (!response.success) {
        console.error("PostStatus failed:", response);
        throw new Error(
          response.message || "An error occurred while posting the status"
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

  //
  // User calls
  //
  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBase64: string,
    imageFileExtension: string
  ): Promise<[User, AuthToken]> {
    const request: RegisterRequest = {
      firstName,
      lastName,
      alias,
      password,
      userImageBase64,
      imageFileExtension,
      token: "dummy_token_for_registration",
    };

    const response = await this.clientCommunicator.doPost<
      RegisterRequest,
      RegisterResponse
    >(request, "/register");

    if (response.success) {
      const user = response.user
        ? User.fromDto(response.user as UserDto)
        : null;
      const authToken = response.authToken
        ? AuthToken.fromDto(response.authToken as AuthTokenDto)
        : null;

      if (!user || !authToken) {
        throw new Error("Registration failed: User or AuthToken is null.");
      }

      return [user, authToken];
    } else {
      throw new Error(response.message || "Registration failed");
    }
  }

  public async login(
    alias: string,
    password: string
  ): Promise<[User, AuthToken]> {
    const request: LoginRequest = {
      alias,
      password,
      token: "dummy_token_for_login",
    };

    const response = await this.clientCommunicator.doPost<
      LoginRequest,
      LoginResponse
    >(request, "/login");

    if (response.success) {
      const user = response.user
        ? User.fromDto(response.user as UserDto)
        : null;
      const authToken = response.authToken
        ? AuthToken.fromDto(response.authToken as AuthTokenDto)
        : null;

      if (!user || !authToken) {
        throw new Error("Login failed: User or AuthToken is null.");
      }

      return [user, authToken];
    } else {
      throw new Error(response.message || "Login failed");
    }
  }

  public async logout(authToken: AuthToken): Promise<void> {
    const request: LogoutRequest = { token: authToken.token };

    const response = await this.clientCommunicator.doPost<
      LogoutRequest,
      LogoutResponse
    >(request, "/logout");

    if (!response.success) {
      throw new Error(response.message || "Logout failed");
    }
  }

  public async getUser(authToken: AuthToken, alias: string): Promise<User> {
    const request: GetUserRequest = {
      token: authToken.token,
      alias,
    };

    const response = await this.clientCommunicator.doPost<
      GetUserRequest,
      GetUserResponse
    >(request, "/user");

    if (response.success && response.user) {
      const user = User.fromDto(response.user as UserDto);
      if (!user) {
        throw new Error("User retrieval failed: User is null.");
      }
      return user;
    } else {
      throw new Error(response.message || "User not found");
    }
  }
}

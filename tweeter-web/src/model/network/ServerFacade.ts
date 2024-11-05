import {
  PagedUserItemRequest,
  PagedUserItemResponse,
  User,
  UserDto,
} from "tweeter-shared";
import { ClientCommunicator } from "./ClientCommunicator";

export class ServerFacade {
  private SERVER_URL = "TODO: Set this value.";
  private clientCommunicator = new ClientCommunicator(this.SERVER_URL);

  public async getMoreFollowees(
    request: PagedUserItemRequest
  ): Promise<[User[], boolean]> {
    const response = await this.clientCommunicator.doPost<
      PagedUserItemRequest,
      PagedUserItemResponse
    >(request, "/followee/list");

    const items: User[] | null =
      response.success && response.items
        ? response.items.map((dto) => User.fromDto(dto) as User)
        : null;

    if (response.success) {
      if (items == null) {
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
        ? response.items.map((dto) => User.fromDto(dto) as User)
        : null;

    if (response.success) {
      if (items == null) {
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
}

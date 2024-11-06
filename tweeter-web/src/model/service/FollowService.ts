import {
  AuthToken,
  FakeData,
  PagedUserItemRequest,
  User,
  UserDto,
} from "tweeter-shared";
import { ServerFacade } from "../network/ServerFacade";

export class FollowService {
  // instance of ServerFacade to communicate with backend
  private serverFacade = ServerFacade.getInstance();

  public async loadMoreFollowers(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: User | null
  ): Promise<[User[], boolean]> {
    const request: PagedUserItemRequest = {
      token: authToken.token,
      userAlias: userAlias,
      pageSize: pageSize,
      lastItem: lastItem ? lastItem.toDto() : null,
    };

    return await this.serverFacade.getMoreFollowers(request);
  }

  public async loadMoreFollowees(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: User | null
  ): Promise<[User[], boolean]> {
    const request: PagedUserItemRequest = {
      token: authToken.token,
      userAlias: userAlias,
      pageSize: pageSize,
      lastItem: lastItem ? lastItem.toDto() : null,
    };

    return await this.serverFacade.getMoreFollowees(request);
  }

  public async getIsFollowerStatus(
    authToken: AuthToken,
    user: User,
    selectedUser: User
  ): Promise<boolean> {
    const token = authToken.token;
    const userDto: UserDto = user.toDto();
    const selectedUserDto: UserDto = selectedUser.toDto();

    return await this.serverFacade.getIsFollowerStatus(
      token,
      userDto,
      selectedUserDto
    );
  }

  public async getFolloweeCount(
    authToken: AuthToken,
    user: User
  ): Promise<number> {
    const token = authToken.token;
    const userDto = user.toDto();

    return await this.serverFacade.getFolloweeCount(token, userDto);
  }

  public async getFollowerCount(
    authToken: AuthToken,
    user: User
  ): Promise<number> {
    const token = authToken.token;
    const userDto = user.toDto();

    return await this.serverFacade.getFollowerCount(token, userDto);
  }

  public async follow(
    authToken: AuthToken,
    userToFollow: User
  ): Promise<[number, number]> {
    const token = authToken.token;
    const userToFollowDto = userToFollow.toDto();

    return await this.serverFacade.follow(token, userToFollowDto);
  }

  public async unfollow(
    authToken: AuthToken,
    userToUnfollow: User
  ): Promise<[number, number]> {
    const token = authToken.token;
    const userToUnfollowDto = userToUnfollow.toDto();

    return await this.serverFacade.unfollow(token, userToUnfollowDto);
  }
}

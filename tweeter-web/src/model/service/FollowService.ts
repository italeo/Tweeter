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

    console.log(
      "Checking if user:",
      userDto.alias,
      "is following:",
      selectedUserDto.alias
    );

    const isFollower = await this.serverFacade.getIsFollowerStatus(
      token,
      userDto,
      selectedUserDto
    );
    console.log("Is Follower Status:", isFollower);

    return isFollower;
  }

  public async getFolloweeCount(
    authToken: AuthToken,
    user: User
  ): Promise<number> {
    const token = authToken.token;
    const userDto = user.toDto();
    console.log("Fetching followee count for user:", userDto.alias);

    const count = await this.serverFacade.getFolloweeCount(token, userDto);
    console.log("Followee Count:", count);

    return count;
  }

  public async getFollowerCount(
    authToken: AuthToken,
    user: User
  ): Promise<number> {
    const token = authToken.token;
    const userDto = user.toDto();
    console.log("Fetching follower count for user:", userDto.alias);

    const count = await this.serverFacade.getFollowerCount(token, userDto);
    console.log("Follower Count:", count);

    return count;
  }

  public async follow(
    authToken: AuthToken,
    userToFollow: User
  ): Promise<[number, number]> {
    const token = authToken.token;
    const userToFollowDto = userToFollow.toDto();
    console.log("Attempting to follow user:", userToFollowDto.alias);

    const result = await this.serverFacade.follow(token, userToFollowDto);
    console.log(
      "Follow result - Followers Count:",
      result[0],
      "Followees Count:",
      result[1]
    );

    return result;
  }

  public async unfollow(
    authToken: AuthToken,
    userToUnfollow: User
  ): Promise<[number, number]> {
    const token = authToken.token;
    const userToUnfollowDto = userToUnfollow.toDto();
    console.log("Attempting to unfollow user:", userToUnfollowDto.alias);

    const result = await this.serverFacade.unfollow(token, userToUnfollowDto);
    console.log(
      "Unfollow result - Followers Count:",
      result[0],
      "Followees Count:",
      result[1]
    );

    return result;
  }
}

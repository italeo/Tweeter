import { AuthToken, PagedUserItemRequest, User, UserDto } from "tweeter-shared";
import { ServerFacade } from "../network/ServerFacade";

export class FollowService {
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
    const userDto: UserDto = user.toDto();
    const selectedUserDto: UserDto = selectedUser.toDto();

    console.log(
      `Checking if user '${userDto.alias}' is following '${selectedUserDto.alias}'`
    );

    try {
      const isFollower = await this.serverFacade.getIsFollowerStatus(
        authToken.token,
        userDto,
        selectedUserDto
      );
      return isFollower;
    } catch (error) {
      console.error(
        `Error checking follower status for '${userDto.alias}' and '${selectedUserDto.alias}':`,
        error
      );
      throw error;
    }
  }

  public async getFolloweeCount(
    authToken: AuthToken,
    user: User
  ): Promise<number> {
    const userDto = user.toDto();
    console.log(`Fetching followee count for user '${userDto.alias}'`);

    try {
      const count = await this.serverFacade.getFolloweeCount(
        authToken.token,
        userDto
      );
      return count;
    } catch (error) {
      console.error(
        `Error fetching followee count for '${userDto.alias}':`,
        error
      );
      throw error;
    }
  }

  public async getFollowerCount(
    authToken: AuthToken,
    user: User
  ): Promise<number> {
    const userDto = user.toDto();
    console.log("Fetching follower count for user:", userDto.alias);

    try {
      const count = await this.serverFacade.getFollowerCount(
        authToken.token, // token preserved but not used internally
        userDto
      );
      return count;
    } catch (error) {
      console.error(
        `Error fetching follower count for '${userDto.alias}':`,
        error
      );
      throw error;
    }
  }

  public async follow(
    authToken: AuthToken,
    currentUser: User,
    userToFollow: User
  ): Promise<[number, number]> {
    console.log("FollowService.follow called with:", {
      authToken,
      currentUser,
      userToFollow,
    });

    const followerAlias = currentUser.alias; // Extract alias of the current user
    const userToFollowDto = userToFollow.toDto();

    if (!followerAlias || !userToFollowDto.alias) {
      throw new Error("Invalid followerAlias or userToFollowDto.alias");
    }

    console.log("Payload being sent to ServerFacade.follow:", {
      token: authToken.token,
      followerAlias,
      userToFollowDto,
    });

    try {
      const result = await this.serverFacade.follow(
        authToken.token,
        followerAlias,
        userToFollowDto
      );
      return result;
    } catch (error) {
      console.error("FollowService: Error in follow method", error);
      throw error;
    }
  }

  public async unfollow(
    authToken: AuthToken,
    currentUser: User,
    userToUnfollow: User
  ): Promise<[number, number]> {
    console.log("FollowService.unfollow called with:", {
      authToken,
      currentUser,
      userToUnfollow,
    });

    const followerAlias = currentUser.alias; // Extract alias of the current user
    const userToUnfollowDto = userToUnfollow.toDto();

    if (!followerAlias || !userToUnfollowDto.alias) {
      throw new Error("Invalid followerAlias or userToUnfollowDto.alias");
    }

    console.log("Payload being sent to ServerFacade.unfollow:", {
      token: authToken.token,
      followerAlias,
      userToUnfollowDto,
    });

    try {
      const result = await this.serverFacade.unfollow(
        authToken.token,
        followerAlias,
        userToUnfollowDto
      );
      return result;
    } catch (error) {
      console.error("FollowService: Error in unfollow method", error);
      throw error;
    }
  }
}

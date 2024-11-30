import { UserDto } from "tweeter-shared";
import { UserDAO } from "../../database/dao/interfaces/UserDAO";
import { FollowDAO } from "../../database/dao/interfaces/FollowDAO";

export class FollowService {
  private followDAO: FollowDAO;
  private userDAO: UserDAO;

  // Inject DAOs into the service class
  public constructor(followDAO: FollowDAO, userDAO: UserDAO) {
    this.followDAO = followDAO;
    this.userDAO = userDAO;
  }

  public async loadMoreFollowers(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null
  ): Promise<[UserDto[], boolean]> {
    // TODO: Replace with the result of calling server
    const safeLastItem = lastItem ?? undefined;

    try {
      const { followers, hasMore } = await this.followDAO.getFollowers(
        userAlias,
        pageSize,
        safeLastItem
      );
      return [followers, hasMore];
    } catch (err) {
      throw new Error("Error loading followers.");
    }

    // return this.getFakeData(lastItem, pageSize, userAlias);
  }

  public async loadMoreFollowees(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null
  ): Promise<[UserDto[], boolean]> {
    // TODO: Replace with the result of calling server
    const safeLastItem = lastItem ?? undefined;

    try {
      const { followees, hasMore } = await this.followDAO.getFollowees(
        userAlias,
        pageSize,
        safeLastItem
      );
      return [followees, hasMore];
    } catch (err) {
      throw new Error("Error loading followees.");
    }

    // return this.getFakeData(lastItem, pageSize, userAlias);
  }
  // ---- working on this --------
  public async getIsFollowerStatus(
    token: string,
    user: UserDto,
    selectedUser: UserDto
  ): Promise<boolean> {
    // TODO: Replace with the result of calling server
    try {
      return await this.followDAO.isUserFollowing(
        user.alias,
        selectedUser.alias
      );
    } catch (err) {
      throw new Error("Error checking follower status.");
    }
    // return FakeData.instance.isFollower();
  }

  public async getFolloweeCount(
    token: string,
    userDto: UserDto
  ): Promise<number> {
    // TODO: Replace with the result of calling server
    try {
      return await this.followDAO.getFolloweeCount(userDto.alias);
    } catch (err) {
      throw new Error("Error retrieving followee count.");
    }
    // return FakeData.instance.getFolloweeCount(userDto.alias);
  }

  public async getFollowerCount(
    token: string,
    userDto: UserDto
  ): Promise<number> {
    // TODO: Replace with the result of calling server
    try {
      return await this.followDAO.getFollowerCount(userDto.alias);
    } catch (err) {
      throw new Error("Error retrieving follower count.");
    }
    // return FakeData.instance.getFollowerCount(userDto.alias);
  }

  public async follow(
    token: string,
    userToFollowDto: UserDto
  ): Promise<[followerCount: number, followeeCount: number]> {
    try {
      // Perform the follow operation
      await this.followDAO.followUser(token, userToFollowDto.alias);

      // Fetch the current counts
      const followerCount = await this.getFollowerCount(token, userToFollowDto);
      const followeeCount = await this.getFolloweeCount(token, userToFollowDto);

      return [followerCount, followeeCount];
    } catch (err) {
      console.error("Error following user:", err);
      throw new Error("Error following user.");
    }
  }

  public async unfollow(
    token: string,
    userToUnfollowDto: UserDto
  ): Promise<[followerCount: number, followeeCount: number]> {
    try {
      // Perform the unfollow operation
      await this.followDAO.unfollowUser(token, userToUnfollowDto.alias);

      // Fetch the current counts
      const followerCount = await this.getFollowerCount(
        token,
        userToUnfollowDto
      );
      const followeeCount = await this.getFolloweeCount(
        token,
        userToUnfollowDto
      );

      return [followerCount, followeeCount];
    } catch (err) {
      console.error("Error unfollowing user:", err);
      throw new Error("Error unfollowing user.");
    }
  }
}
